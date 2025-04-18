from contextlib import asynccontextmanager
from fastapi import FastAPI, Form, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Client, Deceased, Slot, Contract, PaymentMethodEnum
from crud import create_client, get_all_clients, authenticate_client
from schemas import ClientCreate
from datetime import datetime
import uvicorn
import ngrok
from dotenv import load_dotenv
from loguru import logger
from os import getenv

# TODO: REMOVE NGROK WARNING
# TODO: LEARN HOW TO TRANSITION FROM SQLITE TO MYSQL
load_dotenv()

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
    username: str = Form(...),
    contact_number: str = Form(None),
    email: str = Form(...),
    first_name: str = Form(...),
    middle_name: str = Form(None),
    last_name: str = Form(...),
    gender: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    client_data = ClientCreate(
        username=username,
        contact_number=contact_number,
        email=email,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        gender=gender,
        password=password
    )
    new_client = create_client(db, client_data)
    return {"message": "Client created!", "client_id": new_client.client_id}

# ---------------------
# LOGIN
# ---------------------
@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = authenticate_client(db, username=username, password=password)
    if user:
        return {"message": "Login successful", "client_id": user.client_id}
    else:
        return {"message": "Invalid username or password"}

# ---------------------
# DASHBOARD - CLIENT
# ---------------------
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse("main_dashboard.html", {"request": request})

@app.get("/dashboard/buyaplan", response_class=HTMLResponse)
def buy_a_plan(request: Request):
    return templates.TemplateResponse("client_buyaplan.html", {"request": request})

@app.get("/dashboard/payment", response_class=HTMLResponse)
def payment(request: Request):
    return templates.TemplateResponse("client_payment.html", {"request": request})

@app.get("/dashboard/vicinity_map", response_class=HTMLResponse)
def vicinity_map(request: Request):
    return templates.TemplateResponse("vicinity_map.html", {"request": request})

@app.get("/dashboard/contact_us", response_class=HTMLResponse)
def contact_us(request: Request):
    return templates.TemplateResponse("contact_us.html", {"request": request})

# ---------------------
# API - DECEASED BY SLOT ID
# ---------------------
@app.get("/api/slot/{slot_id}")
def get_deceased_by_slot(slot_id: int, db: Session = Depends(get_db)):
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

    # If no deceased but slot exists
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
def get_contracts_by_client(client_id: int, db: Session = Depends(get_db)):
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()

    if not contracts:
        return JSONResponse(content={"message": "No contracts found for this client"}, status_code=404)

    result = []
    for c in contracts:
        result.append({
            "order_id": c.order_id,  # Changed from contract_id to order_id
            "client_id": c.client_id,
            "slot_id": c.slot_id,
            "contract_price": c.contract_price,  # Changed from price
            "vat_percent": c.vat_percent,  # Changed from vat
            "admin_fee": c.admin_fee,  # Changed from transfer_fee
            "down_payment": c.down_payment,
            "monthly_amortization": c.monthly_amortization,
            "final_price": c.final_price,  # Changed from full_payment
            "years_to_pay": c.years_to_pay,
            "order_date": c.order_date,  # Changed from created_at
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
    db: Session = Depends(get_db)
):
    try:
        slot_id = payload.get("slot_id")
        client_id = payload.get("client_id")
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
    client_id: int, 
    db: Session = Depends(get_db)
):
    # Simulate fetching client (you can skip if unnecessary)
    contract = db.query(Contract).filter(
        Contract.order_id == order_id,
        Contract.client_id == client_id
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