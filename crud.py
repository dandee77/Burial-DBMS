from sqlalchemy.orm import Session
from models import Client
from schemas import ClientCreate
from datetime import datetime

# ---------------------
# CLIENT CRUD
# ---------------------
def create_client(db: Session, client: ClientCreate):
    new_client = Client(
        name=client.name,
        email=client.email,
        password=client.password,
        date_created=datetime.utcnow(),
        contact_number=None,
        address=None
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

def get_all_clients(db: Session):
    return db.query(Client).all()

# todo: change username to email
def authenticate_client(db: Session, email: str, password: str):
    return db.query(Client).filter_by(email=email, password=password).first()
