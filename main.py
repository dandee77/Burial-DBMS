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

# Security settings
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# TODO: REMOVE NGROK WARNING
# TODO: LEARN HOW TO TRANSITION FROM SQLITE TO MYSQL
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
        
        response = JSONResponse(
            content={
                "message": "Client created successfully!",
                "access_token": access_token,
                "client_id": new_client.client_id
            }
        )
        
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

@app.get("/dashboard/contact_us", response_class=HTMLResponse)
def contact_us(
    request: Request,
    current_user_id: int = Depends(get_current_user_id)
):
    return templates.TemplateResponse(
        "contact_us.html",
        {"request": request, "client_id": current_user_id}
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

    deceased_list = db.query(Deceased).filter(Deceased.slot_id == slot_id).all()

    result = []
    for d in deceased_list:
        result.append({
            "slot_id": slot.slot_id,
            "slot_type": slot.slot_type,
            "availability": slot.availability,
            "price": slot.price,
            "client_id": slot.client_id,
            "name": d.name,
            "birth_date": d.birth_date,
            "death_date": d.death_date,
        })

    if not result:
        result.append({
            "slot_id": slot.slot_id,
            "slot_type": slot.slot_type,
            "availability": slot.availability,
            "price": slot.price,
            "client_id": slot.client_id
        })

    return result


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
        deceased_name = payload.get("deceased_name")
        birth_date = payload.get("birth_date")
        death_date = payload.get("death_date")

        # Validate required fields
        if not all([slot_id, client_id, deceased_name, birth_date, death_date]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields (slot_id, client_id, deceased_name, birth_date, death_date)"
            )

        # Convert string dates to datetime objects
        try:
            birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()
            death_date = datetime.strptime(death_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Please use YYYY-MM-DD"
            )

        slot = db.query(Slot).filter(Slot.slot_id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot.availability != "available":
            raise HTTPException(status_code=400, detail="Slot is not available")

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

            is_paid=False,
            is_paid_on_time=False,
            latest_payment_date=None
        )

        db.add(contract)
        db.commit()
        db.refresh(contract)


        deceased = Deceased(
            client_id=client_id,
            slot_id=slot_id,
            name=deceased_name,
            birth_date=birth_date,
            death_date=death_date
        )

        db.add(deceased)
        
        # Update slot
        slot.availability = "occupied"
        slot.client_id = client_id
        
        db.commit()

        return {
            "message": "Contract created successfully",
            "order_id": contract.order_id,
            "deceased_id": deceased.deceased_id
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
        # Simulate payment
        contract.years_to_pay -= 1
        contract.latest_payment_date = datetime.now()
        contract.is_paid_on_time = True

        if contract.years_to_pay <= 0:
            contract.is_paid = True

        db.commit()
        db.refresh(contract)

        return {
            "message": "Payment processed successfully",
            "remaining_years": contract.years_to_pay,
            "is_fully_paid": contract.is_paid
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