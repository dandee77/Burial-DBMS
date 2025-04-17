from contextlib import asynccontextmanager
from fastapi import FastAPI, Form, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Client
from crud import create_client, get_all_clients, authenticate_client
from schemas import ClientCreate
from datetime import datetime
import uvicorn
import ngrok
from dotenv import load_dotenv
from loguru import logger
from os import getenv

# TODO: REMOVE NGROK WARNING
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

# ---------------------
# DEBUG/DEV ROUTES
# ---------------------
@app.get("/clients")
def get_clients(db: Session = Depends(get_db)):
    return get_all_clients(db)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=APPLICATION_PORT, reload=True)
