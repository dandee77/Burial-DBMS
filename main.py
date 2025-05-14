from contextlib import asynccontextmanager
from fastapi import FastAPI, Form, Request, Depends, HTTPException, Response, Cookie
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Client, Deceased, Slot, Contract, PaymentMethodEnum
from crud import create_client, get_all_clients, authenticate_client
from schemas import ClientCreate
from datetime import datetime, timedelta
import uvicorn
import ngrok
from dotenv import load_dotenv
from loguru import logger
from os import getenv
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
from typing import List
from pydantic import BaseModel
from typing import Any
from sqlalchemy import func, text

# Security settings
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# TODO: MAKE IT RESPONSIVE
# TODO: SHOW OFFERS (3, 5, 10) in vicinity map instead of just price: 0.0
# TODO:CLIENT PAGE INDEED CAN DELETE USERS BUT NOT THEIR CONTRACTS AND ALSO SLOT & DECEASED INFOMATION
# TODO: REMOVE NGROK WARNING
# TODO: LEARN HOW TO TRANSITION FROM SQLITE TO MYSQL
# TODO: CLIENT PROFILE "EDIT PROFILE" BUTTON RESPONSIVENESS ON MOBILE
# TODO: MAKE LANDING PAGE RESPONSIVE
load_dotenv()

#TODO: FIX LOGIN AND SIGNUP
#TODO: SIGNUP DOES NOT REDIRECT AND IT CRASHES WHEN SIGN IN AN EXISTING ACC

NGROK_AUTH_TOKEN = getenv("NGROK_AUTH_TOKEN", "NGROK_AUTH_TOKEN")
APPLICATION_PORT = 80
NGROK_DOMAIN = "foal-engaged-regularly.ngrok-free.app"

@asynccontextmanager
async def lifespan(app: FastAPI):
    ngrok.set_auth_token(NGROK_AUTH_TOKEN)
    public_url = ngrok.connect(
        addr=APPLICATION_PORT,
        domain=NGROK_DOMAIN, 
        proto="http"
    )
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    engine.dispose()
    print("Tables created!")
    yield

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#TODO: SHITS DEPRECATED
# Security utilities
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/login")
async def login_user(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Authenticate user
        user = authenticate_client(db, email=email, password=password)
        if not user:
            return JSONResponse(
                status_code=401,
                content={"detail": "Incorrect email or password"}
            )
        
        # Create access token
        access_token = create_access_token({"sub": str(user.client_id)})
        
        # Create response with success message
        response = JSONResponse(
            status_code=200,  # Explicitly set 200 status
            content={
                "message": "Login successful",
                "access_token": access_token,
                "client_id": user.client_id
            }
        )
        
        # Set secure cookie with token
        response.set_cookie(
            key="session_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=3600  # 1 hour
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An error occurred during login"}
        )

# Custom error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # For API requests (expecting JSON), return JSON response
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    # For 401 Unauthorized errors
    if exc.status_code == 401:
        return templates.TemplateResponse(
            "error_page.html",
            {
                "request": request,
                "status_code": 401,
                "title": "Unauthorized Access",
                "message": "You need to be logged in to access this page. Please log in with your credentials to continue."
            },
            status_code=401
        )
    
    # For 404 Not Found errors
    if exc.status_code == 404:
        return templates.TemplateResponse(
            "error_page.html",
            {
                "request": request,
                "status_code": 404,
                "title": "Page Not Found",
                "message": "The page you are looking for doesn't exist or has been moved."
            },
            status_code=404
        )
    
    # Generic error handler for other HTTP errors
    return templates.TemplateResponse(
        "error_page.html",
        {
            "request": request,
            "status_code": exc.status_code,
            "title": "An Error Occurred",
            "message": exc.detail
        },
        status_code=exc.status_code
    )

# Handle 404 for non-existent routes
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Any):
    return templates.TemplateResponse(
        "error_page.html",
        {
            "request": request,
            "status_code": 404,
            "title": "Page Not Found",
            "message": "The page you are looking for doesn't exist or has been moved."
        },
        status_code=404
    )

# Now update the get_current_user_id function to use the HTTPException that will be caught by your handler
async def get_current_user_id(
    request: Request,
    db: Session = Depends(get_db)
) -> int:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Please log in to access this page",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from cookie first
    token = request.cookies.get("session_token")
    
    # If no cookie, try to get token from Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        client_id = int(payload.get("sub"))
        if client_id is None:
            raise credentials_exception
            
        # Verify user exists
        client = db.query(Client).filter(Client.client_id == client_id).first()
        if client is None:
            raise credentials_exception
            
        return client_id
    except (JWTError, ValueError):
        raise credentials_exception

# ---------------------
# LANDING PAGE
# ---------------------
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("landing_page.html", {"request": request})

# ---------------------
# CLIENT CREATION
# ---------------------
@app.get("/signup", response_class=HTMLResponse)
def client_form(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.post("/submit-client")
def submit_client(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Check if user already exists
        existing_user = db.query(Client).filter(Client.email == email).first()
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={"detail": "Email already registered"}
            )

        # Hash the password before creating the client
        hashed_password = pwd_context.hash(password)
        
        client_data = ClientCreate(
            name=name,
            email=email,
            password=hashed_password,  # Store the hashed password
            contact_number=None,
            address=None  
        )
        
        new_client = create_client(db, client_data)
        
        # Create access token
        access_token = create_access_token({"sub": str(new_client.client_id)})
        
        # Create HTML response that sets localStorage and redirects
        html_content = f"""
        <html>
            <head>
                <title>Redirecting...</title>
            </head>
            <body>
                <p>Account created successfully. Redirecting to dashboard...</p>
                <script>
                    localStorage.setItem('access_token', '{access_token}');
                    localStorage.setItem('client_id', '{new_client.client_id}');
                    window.location.href = '/dashboard';
                </script>
            </body>
        </html>
        """
        response = HTMLResponse(content=html_content)
        
        # Set secure cookie
        response.set_cookie(
            key="session_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=3600  # 1 hour
        )
        return response
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An error occurred during signup"}
        )

# ---------------------
# LOGIN
# ---------------------
@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="session_token")
    return response

# ---------------------
# DASHBOARD - CLIENT
# ---------------------
@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "main_dashboard.html",
        {"request": request, "client_id": current_user_id}
    )

@app.get("/dashboard/buyaplan", response_class=HTMLResponse)
def buy_a_plan(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "client_buyaplan.html",
        {"request": request, "client_id": current_user_id}
    )

@app.get("/dashboard/payment", response_class=HTMLResponse)
def payment(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "client_payment.html",
        {"request": request, "client_id": current_user_id}
    )

@app.get("/dashboard/vicinity_map", response_class=HTMLResponse)
def vicinity_map(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "vicinity_map.html",
        {"request": request, "client_id": current_user_id}
    )

@app.get("/dashboard/profile", response_class=HTMLResponse)
def client_profile(
    request: Request,
    message: str = None,
    type: str = None,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Get the client data
    client = db.query(Client).filter(Client.client_id == current_user_id).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return templates.TemplateResponse(
        "client_profile.html",
        {
            "request": request,
            "client": client,
            "message": message,
            "message_type": type
        }
    )

@app.post("/api/client/update")
async def update_client(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(None),
    contact_number: str = Form(None),
    address: str = Form(None),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        # Get the current client
        client = db.query(Client).filter(Client.client_id == current_user_id).first()
        if not client:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Client not found"}
            )
        
        # Check if email is already in use by another client
        if email != client.email:
            existing_client = db.query(Client).filter(Client.email == email).first()
            if existing_client:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "Email already in use by another account"}
                )
        
        # Update client information
        client.name = name
        client.email = email
        
        # Only update password if provided
        if password and password.strip():
            if len(password) < 8:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": "Password must be at least 8 characters long"}
                )
            client.password = pwd_context.hash(password)
        
        # Update optional fields
        client.contact_number = contact_number if contact_number else None
        client.address = address if address else None
        
        db.commit()
        
        return JSONResponse(
            content={"success": True, "message": "Profile updated successfully"}
        )
        
    except Exception as e:
        logger.error(f"Error updating client: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "An error occurred while updating profile"}
        )

# ---------------------
# API - DECEASED BY SLOT ID
# ---------------------
@app.get("/api/slot/{slot_id}")
def get_deceased_by_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    slot = db.query(Slot).filter(Slot.slot_id == slot_id).first()
    if not slot:
        return JSONResponse(content={"message": "Slot not found"}, status_code=404)

    try:
        # Use direct SQL query with all columns including name
        deceased_data = db.execute(
            text("SELECT deceased_id, slot_id, client_id, name, birth_date, death_date FROM Deceased WHERE slot_id = :slot_id"),
            {"slot_id": slot_id}
        ).fetchall()
        
        result = []
        if deceased_data:
            for d in deceased_data:
                deceased_info = {
                    "slot_id": slot.slot_id,
                    "slot_type": slot.slot_type,
                    "availability": slot.availability,
                    "price": slot.price,
                    "client_id": slot.client_id,
                    "name": d[3] or f"Deceased #{d[0]}",  # Use actual name or fallback to ID if null
                    "birth_date": d[4],
                    "death_date": d[5]
                }
                result.append(deceased_info)
        
        if not result:
            result.append({
                "slot_id": slot.slot_id,
                "slot_type": slot.slot_type,
                "availability": slot.availability,
                "price": slot.price,
                "client_id": slot.client_id
            })
        
        return result
    except Exception as e:
        logger.error(f"Error fetching deceased by slot: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to load deceased information"}
        )

# ---------------------
# API - CONTRACTS BY CLIENT ID
# ---------------------
@app.get("/api/contracts/client/{client_id}")
def get_contracts_by_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    # Verify the user is accessing their own contracts
    if client_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view these contracts"
        )

    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()

    if not contracts:
        return JSONResponse(
            content={"message": "No contracts found for this client"},
            status_code=404
        )

    result = []
    for c in contracts:
        result.append({
            "order_id": c.order_id,
            "client_id": c.client_id,
            "slot_id": c.slot_id,
            "contract_price": c.contract_price,
            "vat_percent": c.vat_percent,
            "admin_fee": c.admin_fee,
            "down_payment": c.down_payment,
            "monthly_amortization": c.monthly_amortization,
            "final_price": c.final_price,
            "years_to_pay": c.years_to_pay,
            "order_date": c.order_date,
            "slot_type": c.slot.slot_type if c.slot else None,
            "payment_method": c.payment_method if c.payment_method else None,
            "is_paid": c.is_paid,
            "is_paid_on_time": c.is_paid_on_time,
            "latest_payment_date": c.latest_payment_date,
            "interest_rate": c.interest_rate,
            "vat_amount": c.vat_amount,
            "price_with_vat": c.price_with_vat,
            "spot_cash_total": c.spot_cash_total
        })

    return result


@app.get("/api/available_slots")
def get_available_slots(db: Session = Depends(get_db)):
    available_slots = db.query(Slot).filter(Slot.availability == "available").all()
    if not available_slots:
        return JSONResponse(content={"message": "No available slots"}, status_code=404)

    result = []
    for slot in available_slots:
        result.append({
            "slot_id": slot.slot_id,
            "slot_type": slot.slot_type,
            "availability": slot.availability,
            "price": slot.price,
            "client_id": slot.client_id
        })

    return result


@app.post("/api/contracts/create")
def create_contract(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    try:
        slot_id = payload.get("slot_id")
        client_id = current_user_id  # Use the authenticated user's ID
        years_to_pay = payload.get("years_to_pay", 0)
        payment_method = payload.get("payment_method")
        
        # Handle both new and old API formats for deceased information
        deceased_info = payload.get("deceased_info")
        
        # If new format is not present, try to use the old format
        if deceased_info is None:
            deceased_name = payload.get("deceased_name")
            birth_date = payload.get("birth_date")
            death_date = payload.get("death_date")
            
            if all([deceased_name, birth_date, death_date]):
                deceased_info = [{
                    "name": deceased_name,
                    "birth_date": birth_date,
                    "death_date": death_date
                }]
            else:
                deceased_info = []
        elif not isinstance(deceased_info, list):
            # Handle case where deceased_info is provided but not as a list
            deceased_info = [deceased_info]
        
        # Validate required fields
        if not all([slot_id, client_id]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields (slot_id, client_id)"
            )
            
        if not deceased_info:
            raise HTTPException(
                status_code=400,
                detail="No deceased information provided"
            )

        slot = db.query(Slot).filter(Slot.slot_id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot.availability != "available":
            raise HTTPException(status_code=400, detail="Slot is not available")
            
        # Validate for mausoleum capacity
        if slot.slot_type == "mausoleum" and len(deceased_info) > 10:
            raise HTTPException(
                status_code=400,
                detail="Mausoleum can hold a maximum of 10 deceased records"
            )
        elif slot.slot_type == "plot" and len(deceased_info) > 1:
            raise HTTPException(
                status_code=400,
                detail="Plot can only hold a single deceased record"
            )
            
        # Validate all deceased entries
        deceased_records = []
        for info in deceased_info:
            name = info.get("name")
            birth_date_str = info.get("birth_date")
            death_date_str = info.get("death_date")
            
            if not all([name, birth_date_str, death_date_str]):
                raise HTTPException(
                    status_code=400,
                    detail="Missing deceased information fields (name, birth_date, death_date)"
                )
                
            # Convert string dates to datetime objects
            try:
                birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
                death_date = datetime.strptime(death_date_str, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Please use YYYY-MM-DD"
                )
                
            deceased_records.append({
                "name": name,
                "birth_date": birth_date,
                "death_date": death_date
            })

        # Constants
        contract_price = 300_000.0 if slot.slot_type == "plot" else 10_000_000.0
        vat_percent = 12.0
        vat_amount = contract_price * vat_percent / 100
        price_with_vat = contract_price + vat_amount
        admin_fee = 5000.0 if slot.slot_type == "plot" else 25000.0
        spot_cash_total = price_with_vat + admin_fee
        down_payment = price_with_vat * 0.20

        # Interest and amortization logic
        interest_rate = 0.0
        monthly_amortization = 0.0
        final_price = spot_cash_total

        if years_to_pay > 0:
            if years_to_pay == 60:
                interest_rate = 0.00525
            elif years_to_pay == 120:
                interest_rate = 0.00623
            elif years_to_pay == 36:
                interest_rate = 0.0034286

            principal = price_with_vat - down_payment
            periods = years_to_pay - 1
            monthly_amortization = principal * ((interest_rate * pow(1 + interest_rate, periods)) / (pow(1 + interest_rate, periods) - 1))
            final_price = down_payment + monthly_amortization * periods

        # Create contract
        contract = Contract(
            client_id=client_id,
            slot_id=slot_id,
            order_date=datetime.now(),
            payment_method=PaymentMethodEnum(payment_method),

            contract_price=contract_price,
            vat_percent=vat_percent,
            vat_amount=vat_amount,
            price_with_vat=price_with_vat,
            admin_fee=admin_fee,
            spot_cash_total=spot_cash_total,

            interest_rate=interest_rate,
            down_payment=down_payment,
            years_to_pay=years_to_pay,
            monthly_amortization=monthly_amortization,
            final_price=final_price,

            is_paid=years_to_pay == 0,  # Set to True if years_to_pay is 0 (fully paid upfront)
            is_paid_on_time=True,  # Initially set to true until first payment is due
            latest_payment_date=datetime.now()  # Set initial payment date to contract creation date
        )

        db.add(contract)
        db.commit()
        db.refresh(contract)

        # Create deceased records
        deceased_ids = []
        for record in deceased_records:
            # Use SQL query that includes the name column
            query = text("""
                INSERT INTO Deceased (slot_id, client_id, name, birth_date, death_date)
                VALUES (:slot_id, :client_id, :name, :birth_date, :death_date)
                RETURNING deceased_id
            """)
            
            result = db.execute(
                query,
                {
                    "slot_id": slot_id,
                    "client_id": client_id,
                    "name": record["name"],  # Store the actual name
                    "birth_date": record["birth_date"],
                    "death_date": record["death_date"]
                }
            )
            
            deceased_id = result.fetchone()[0]
            deceased_ids.append(deceased_id)
        
        # Update slot
        slot.availability = "occupied"
        slot.client_id = client_id
        
        db.commit()

        return {
            "message": "Contract created successfully",
            "order_id": contract.order_id,
            "deceased_ids": deceased_ids,
            "deceased_count": len(deceased_ids)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Contract creation failed: {str(e)}"
        )

# ---------------------
# API - UDPATE CONTRACT PAYMENT
# ---------------------
@app.post("/api/contracts/{order_id}/payment")
def process_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    # Verify the contract belongs to the authenticated user
    contract = db.query(Contract).filter(
        Contract.order_id == order_id,
        Contract.client_id == current_user_id
    ).first()

    if not contract:
        return JSONResponse(
            content={"message": "Contract not found or not authorized"},
            status_code=404
        )

    if contract.is_paid:
        return JSONResponse(
            content={"message": "Contract is already fully paid"},
            status_code=400
        )

    if contract.years_to_pay <= 0:
        return JSONResponse(
            content={"message": "No remaining payments on this contract"},
            status_code=400
        )

    try:
        # Calculate if payment is on time (within 30 days of last payment or order date)
        current_time = datetime.now()
        last_payment_date = contract.latest_payment_date or contract.order_date
        days_since_last_payment = (current_time - last_payment_date).days
        
        # Update payment status in the contract
        contract.years_to_pay -= 1
        contract.latest_payment_date = current_time
        
        # Payment is on time if it's within 30 days of the last payment
        contract.is_paid_on_time = days_since_last_payment <= 30

        if contract.years_to_pay <= 0:
            contract.is_paid = True

        db.commit()
        db.refresh(contract)

        return {
            "message": "Payment processed successfully",
            "remaining_years": contract.years_to_pay,
            "is_fully_paid": contract.is_paid,
            "is_paid_on_time": contract.is_paid_on_time,
            "days_since_last_payment": days_since_last_payment
        }

    except Exception as e:
        db.rollback()
        return JSONResponse(
            content={"message": f"Payment failed: {str(e)}"},
            status_code=500
        )

# ---------------------
# DEBUG/DEV ROUTES
# ---------------------
@app.get("/clients")
def get_clients(db: Session = Depends(get_db)):
    return get_all_clients(db)

@app.get("/deceased")
def get_deceased(db: Session = Depends(get_db)):
    return db.query(Deceased).all()

@app.get("/slots")
def get_slots(db: Session = Depends(get_db)):
    return db.query(Slot).all()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=APPLICATION_PORT, reload=True)


# Add this temporary debug route to your main.py
@app.get("/debug/client/{client_id}")
def debug_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_id == client_id).first()
    if not client:
        return {"message": "Client not found"}
    
    slots = db.query(Slot).filter(Slot.client_id == client_id).all()
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
    
    return {
        "client": client,
        "slots": [s.slot_id for s in slots],
        "contracts": [c.order_id for c in contracts]
    }

@app.get("/debug/all-contracts")
def debug_all_contracts(db: Session = Depends(get_db)):
    contracts = db.query(Contract).all()
    return [{
        "order_id": c.order_id,
        "client_id": c.client_id,
        "slot_id": c.slot_id,
        "client_exists": db.query(Client).filter(Client.client_id == c.client_id).first() is not None,
        "slot_exists": db.query(Slot).filter(Slot.slot_id == c.slot_id).first() is not None
    } for c in contracts]

class ContractResponse(BaseModel):
    order_id: int
    client_id: int
    slot_id: int
    contract_price: float
    vat_percent: float
    admin_fee: float
    down_payment: float
    monthly_amortization: float
    final_price: float
    years_to_pay: int
    order_date: str | None
    slot_type: str | None
    payment_method: str | None
    is_paid: bool
    is_paid_on_time: bool
    latest_payment_date: str | None
    interest_rate: float
    vat_amount: float
    price_with_vat: float
    spot_cash_total: float

@app.get("/api/contracts/client/current", response_model=List[ContractResponse])
async def get_current_user_contracts(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Get the current user's ID from the token
        token = request.cookies.get("session_token")
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_id = int(payload.get("sub"))
            if not current_user_id:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication token"
                )
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        # Get the user's contracts
        contracts = db.query(Contract).filter(Contract.client_id == current_user_id).all()
        
        if not contracts:
            return []  # Return empty list instead of 404

        result = []
        for c in contracts:
            # Get the slot type
            slot = db.query(Slot).filter(Slot.slot_id == c.slot_id).first()
            slot_type = slot.slot_type if slot else None

            # Ensure all numeric fields are explicitly converted to float and dates are properly formatted
            contract_data = ContractResponse(
                order_id=c.order_id,
                client_id=c.client_id,
                slot_id=c.slot_id,
                contract_price=float(c.contract_price),
                vat_percent=float(c.vat_percent),
                admin_fee=float(c.admin_fee),
                down_payment=float(c.down_payment),
                monthly_amortization=float(c.monthly_amortization),
                final_price=float(c.final_price),
                years_to_pay=c.years_to_pay,
                order_date=c.order_date.isoformat() if c.order_date else None,
                slot_type=slot_type,
                payment_method=c.payment_method.value if c.payment_method else None,
                is_paid=c.is_paid,
                is_paid_on_time=c.is_paid_on_time,
                latest_payment_date=c.latest_payment_date.isoformat() if c.latest_payment_date else None,
                interest_rate=float(c.interest_rate),
                vat_amount=float(c.vat_amount),
                price_with_vat=float(c.price_with_vat),
                spot_cash_total=float(c.spot_cash_total)
            )
            result.append(contract_data)

        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching contracts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching contracts"
        )

@app.get("/api/user/info")
async def get_user_info(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Get the current user's ID from the token
        token = request.cookies.get("session_token")
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_id = int(payload.get("sub"))
            if not current_user_id:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication token"
                )
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        # Get the user from the database
        client = db.query(Client).filter(Client.client_id == current_user_id).first()
        if not client:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Return only necessary user info
        return {
            "client_id": client.client_id,
            "name": client.name,
            "email": client.email
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching user information"
        )

# Add this after the other exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the error
    logger.error(f"Unhandled exception: {str(exc)}")
    
    # For API requests, return JSON
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."}
        )
    
    # For other requests, show error page
    return templates.TemplateResponse(
        "error_page.html",
        {
            "request": request,
            "status_code": 500,
            "title": "Internal Server Error",
            "message": "Something went wrong on our side. Please try again later or contact support if the problem persists."
        },
        status_code=500
    )

# Test error pages (remove in production)
@app.get("/test-error/{status_code}")
async def test_error(request: Request, status_code: int):
    error_messages = {
        401: "This is a test 401 Unauthorized error",
        404: "This is a test 404 Not Found error",
        500: "This is a test 500 Internal Server Error"
    }
    
    raise HTTPException(
        status_code=status_code,
        detail=error_messages.get(status_code, f"Test error with status code {status_code}")
    )

@app.get("/dashboard/message_us", response_class=HTMLResponse)
def message_us(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "message_us.html",
        {"request": request, "client_id": current_user_id}
    )

# ---------------------
# ADMIN ROUTES
# ---------------------
ADMIN_PIN = getenv("ADMIN_PIN")

@app.get("/admin", response_class=HTMLResponse)
def admin_login(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request})

@app.post("/admin/verify-pin")
async def verify_admin_pin(request: Request):
    try:
        data = await request.json()
        pin = data.get("pin")
        
        if pin == ADMIN_PIN:
            # Create a simple admin token
            admin_token = create_access_token({"sub": "admin", "role": "admin"})
            
            response = JSONResponse(
                content={"success": True, "message": "Authentication successful"}
            )
            
            # Set secure cookie with admin token
            response.set_cookie(
                key="admin_token",
                value=admin_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=3600  # 1 hour
            )
            
            return response
        else:
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Invalid PIN"}
            )
            
    except Exception as e:
        logger.error(f"Admin PIN verification error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "An error occurred during authentication"}
        )

# Middleware to verify admin authentication
async def verify_admin_auth(request: Request):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Admin authentication required",
    )
    
    # Try to get token from cookie
    token = request.cookies.get("admin_token")
    
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        
        if role != "admin":
            raise credentials_exception
            
        return True
    except (JWTError, ValueError):
        raise credentials_exception

@app.get("/admin/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    is_admin: bool = Depends(verify_admin_auth)
):
    return templates.TemplateResponse("admin_analytics.html", {"request": request})

@app.post("/admin/logout")
def admin_logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="admin_token")
    return response

# ---------------------
# ADMIN API - ANALYTICS
# ---------------------
@app.get("/api/admin/analytics/summary")
async def admin_analytics_summary(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Get total clients
        total_clients = db.query(Client).count()
        
        # Get total slots
        total_slots = db.query(Slot).count()
        
        # Get available and occupied slots
        available_slots = db.query(Slot).filter(Slot.availability == "available").count()
        occupied_slots = db.query(Slot).filter(Slot.availability == "occupied").count()
        
        # Get total contracts
        total_contracts = db.query(Contract).count()
        
        # Calculate total revenue
        total_revenue = db.query(func.sum(Contract.final_price)).scalar() or 0
        
        # Get overdue contracts
        current_date = datetime.now()
        thirty_days_ago = current_date - timedelta(days=30)
        
        overdue_contracts = db.query(Contract).filter(
            Contract.is_paid == False,
            Contract.years_to_pay > 0,
            (Contract.latest_payment_date == None) | (Contract.latest_payment_date <= thirty_days_ago)
        ).count()
        
        # Get contracts with payments on time
        on_time_payments = db.query(Contract).filter(
            Contract.is_paid_on_time == True,
            Contract.latest_payment_date != None
        ).count()
        
        return {
            "total_clients": total_clients,
            "total_slots": total_slots,
            "available_slots": available_slots,
            "occupied_slots": occupied_slots,
            "total_contracts": total_contracts,
            "total_revenue": total_revenue,
            "overdue_contracts": overdue_contracts,
            "on_time_payments": on_time_payments
        }
    except Exception as e:
        logger.error(f"Analytics summary error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch analytics data"
        )

@app.get("/api/admin/analytics/revenue-by-month")
async def admin_revenue_by_month(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Get current year
        current_year = datetime.now().year
        
        # Extract months from contract order dates and sum up revenue
        monthly_revenue = []
        
        for month in range(1, 13):
            start_date = datetime(current_year, month, 1)
            if month == 12:
                end_date = datetime(current_year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = datetime(current_year, month + 1, 1) - timedelta(days=1)
            
            # Sum contract values for the month
            month_revenue = db.query(func.sum(Contract.final_price)).filter(
                Contract.order_date >= start_date,
                Contract.order_date <= end_date
            ).scalar() or 0
            
            monthly_revenue.append({
                "month": start_date.strftime("%b"),
                "revenue": float(month_revenue)
            })
        
        return monthly_revenue
    except Exception as e:
        logger.error(f"Revenue by month error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch revenue data"
        )

@app.get("/api/admin/analytics/recent-contracts")
async def admin_recent_contracts(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Get 5 most recent contracts
        recent_contracts = db.query(Contract).order_by(Contract.order_date.desc()).limit(5).all()
        
        result = []
        for contract in recent_contracts:
            # Get client name
            client = db.query(Client).filter(Client.client_id == contract.client_id).first()
            client_name = client.name if client else "Unknown"
            
            # Get slot type
            slot = db.query(Slot).filter(Slot.slot_id == contract.slot_id).first()
            slot_type = slot.slot_type if slot else "Unknown"
            
            result.append({
                "order_id": contract.order_id,
                "client_name": client_name,
                "slot_id": contract.slot_id,
                "slot_type": slot_type,
                "order_date": contract.order_date.strftime("%Y-%m-%d"),
                "amount": float(contract.final_price),
                "is_paid": contract.is_paid
            })
        
        return result
    except Exception as e:
        logger.error(f"Recent contracts error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch recent contracts"
        )

@app.get("/api/admin/analytics/plot-distribution")
async def admin_plot_distribution(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Count slots by type
        plot_count = db.query(Slot).filter(Slot.slot_type == "plot").count()
        mausoleum_count = db.query(Slot).filter(Slot.slot_type == "mausoleum").count()
        
        # Get availability by type
        available_plots = db.query(Slot).filter(
            Slot.slot_type == "plot",
            Slot.availability == "available"
        ).count()
        
        available_mausoleums = db.query(Slot).filter(
            Slot.slot_type == "mausoleum",
            Slot.availability == "available"
        ).count()
        
        return {
            "plot_distribution": [
                {"type": "Plot", "total": plot_count, "available": available_plots},
                {"type": "Mausoleum", "total": mausoleum_count, "available": available_mausoleums}
            ]
        }
    except Exception as e:
        logger.error(f"Plot distribution error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch plot distribution data"
        )

# Admin Client management routes
@app.get("/admin/clients")
async def admin_clients_page(
    request: Request,
    is_admin: bool = Depends(verify_admin_auth)
):
    return templates.TemplateResponse("admin_clients.html", {"request": request})

# Admin API for clients
@app.get("/api/admin/clients")
async def admin_get_clients(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    # Get all clients with contract count
    clients = db.query(Client).all()
    
    result = []
    for client in clients:
        # Count contracts for this client
        contract_count = db.query(Contract).filter(Contract.client_id == client.client_id).count()
        
        # Create a client object with contract count
        client_data = {
            "client_id": client.client_id,
            "name": client.name,
            "email": client.email,
            "phone": client.contact_number,
            "address": client.address,
            "registration_date": datetime.now().isoformat(), # Placeholder since actual field doesn't exist
            "contract_count": contract_count
        }
        result.append(client_data)
    
    return result

@app.get("/api/admin/clients/{client_id}/contracts")
async def admin_get_client_contracts(
    client_id: int,
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    # Verify client exists
    client = db.query(Client).filter(Client.client_id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get all contracts for this client
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
    
    result = []
    for contract in contracts:
        # Get slot information
        slot = db.query(Slot).filter(Slot.slot_id == contract.slot_id).first()
        slot_type = slot.slot_type if slot else "Unknown"
        
        # Create contract object
        contract_data = {
            "contract_id": contract.order_id,  # Using order_id instead of contract_id
            "slot_id": contract.slot_id,
            "slot_type": slot_type,
            "order_date": contract.order_date,
            "amount": contract.final_price,  # Using final_price instead of amount
            "is_paid": contract.is_paid
        }
        result.append(contract_data)
    
    return result

@app.delete("/api/admin/clients/{client_id}/delete")
async def admin_delete_client(
    client_id: int,
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    # Verify client exists
    client = db.query(Client).filter(Client.client_id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    try:
        # Get all contracts for this client
        contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
        
        # Delete all client's contracts first
        for contract in contracts:
            # If the contract has a slot, update the slot's status to available
            if contract.slot_id:
                slot = db.query(Slot).filter(Slot.slot_id == contract.slot_id).first()
                if slot:
                    slot.is_available = True
                    db.add(slot)
            
            # Delete the contract
            db.delete(contract)
        
        # Delete the client
        db.delete(client)
        db.commit()
        
        return {"success": True, "message": "Client and all associated contracts deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting client: {str(e)}")

@app.get("/admin/contracts", response_class=HTMLResponse)
async def admin_contracts_page(
    request: Request,
    is_admin: bool = Depends(verify_admin_auth)
):
    return templates.TemplateResponse("admin_contracts.html", {"request": request})

@app.get("/api/admin/contracts")
async def admin_get_contracts(
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Get all contracts with client and slot information
        contracts = db.query(Contract).all()
        
        result = []
        for contract in contracts:
            # Get client information
            client = db.query(Client).filter(Client.client_id == contract.client_id).first()
            client_name = client.name if client else "Unknown"
            
            # Get slot information
            slot = db.query(Slot).filter(Slot.slot_id == contract.slot_id).first()
            slot_type = slot.slot_type if slot else "Unknown"
            
            # Check if contract is overdue
            is_overdue = False
            if not contract.is_paid:
                last_payment_date = contract.latest_payment_date or contract.order_date
                days_since_payment = (datetime.now() - last_payment_date).days
                is_overdue = days_since_payment > 30
            
            # Get total payment months from years_to_pay when the contract was created
            total_payment_months = contract.years_to_pay
            # Calculate payments made so far (total months - remaining months)
            payments_made = 0 if total_payment_months <= 0 else total_payment_months - contract.years_to_pay
            
            contract_data = {
                "id": f"CNT-{contract.order_id}",
                "clientId": f"CL-{contract.client_id}",
                "clientName": client_name,
                "plotType": slot_type.capitalize() if slot_type else "Unknown",
                "plotId": f"PLT-{contract.slot_id}",
                "startDate": contract.order_date.strftime("%Y-%m-%d") if contract.order_date else "Unknown",
                "totalAmount": float(contract.final_price),
                "paidAmount": float(contract.final_price) if contract.is_paid else 
                              float(contract.down_payment + (payments_made * contract.monthly_amortization)),
                "isActive": not contract.is_paid,
                "isOverdue": is_overdue,
                "lastPaymentDate": contract.latest_payment_date.strftime("%Y-%m-%d") if contract.latest_payment_date else "N/A"
            }
            result.append(contract_data)
        
        return {"contracts": result}
        
    except Exception as e:
        logger.error(f"Error fetching admin contracts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch contracts data"
        )

@app.get("/api/admin/contracts/{contract_id}")
async def admin_get_contract_details(
    contract_id: int,
    request: Request,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(verify_admin_auth)
):
    try:
        # Remove CNT- prefix if present
        if isinstance(contract_id, str) and contract_id.startswith("CNT-"):
            contract_id = int(contract_id[4:])
        
        # Get contract with all details
        contract = db.query(Contract).filter(Contract.order_id == contract_id).first()
        
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Get client information
        client = db.query(Client).filter(Client.client_id == contract.client_id).first()
        client_info = {
            "id": f"CL-{client.client_id}" if client else "Unknown",
            "name": client.name if client else "Unknown",
            "email": client.email if client else "Unknown",
            "phone": client.contact_number if client and client.contact_number else "N/A",
            "address": client.address if client and client.address else "N/A"
        }
        
        # Get slot information
        slot = db.query(Slot).filter(Slot.slot_id == contract.slot_id).first()
        slot_info = {
            "id": f"PLT-{slot.slot_id}" if slot else "Unknown",
            "type": slot.slot_type.capitalize() if slot and slot.slot_type else "Unknown",
            "price": float(slot.price) if slot else 0.0
        }
        
        # Check if contract is overdue
        is_overdue = False
        if not contract.is_paid:
            last_payment_date = contract.latest_payment_date or contract.order_date
            days_since_payment = (datetime.now() - last_payment_date).days
            is_overdue = days_since_payment > 30
        
        # Calculate payments made so far
        total_payment_months = contract.years_to_pay
        payments_made = 0 if total_payment_months <= 0 else total_payment_months - contract.years_to_pay
        
        # Format contract details
        contract_details = {
            "id": f"CNT-{contract.order_id}",
            "client": client_info,
            "slot": slot_info,
            "startDate": contract.order_date.strftime("%Y-%m-%d") if contract.order_date else "Unknown",
            "totalAmount": float(contract.final_price),
            "paidAmount": float(contract.final_price) if contract.is_paid else 
                          float(contract.down_payment + (payments_made * contract.monthly_amortization)),
            "downPayment": float(contract.down_payment),
            "monthlyPayment": float(contract.monthly_amortization),
            "yearsRemaining": contract.years_to_pay,
            "paymentMethod": contract.payment_method.value if contract.payment_method else "Unknown",
            "isActive": not contract.is_paid,
            "isOverdue": is_overdue,
            "isPaid": contract.is_paid,
            "lastPaymentDate": contract.latest_payment_date.strftime("%Y-%m-%d") if contract.latest_payment_date else "N/A"
        }
        
        return contract_details
        
    except Exception as e:
        logger.error(f"Error fetching contract details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch contract details"
        )