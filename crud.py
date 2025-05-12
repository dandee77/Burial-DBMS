from sqlalchemy.orm import Session
from models import Client
from schemas import ClientCreate
from datetime import datetime
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------
# CLIENT CRUD
# ---------------------
def create_client(db: Session, client: ClientCreate):
    db_client = Client(
        name=client.name,
        email=client.email,
        password=client.password,  # Password should already be hashed
        date_created=datetime.utcnow(),
        contact_number=client.contact_number,
        address=client.address
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_all_clients(db: Session):
    return db.query(Client).all()

def authenticate_client(db: Session, email: str, password: str):
    client = db.query(Client).filter(Client.email == email).first()
    if not client:
        return None
    if not pwd_context.verify(password, client.password):
        return None
    return client
