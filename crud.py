from sqlalchemy.orm import Session
from models import Client
from schemas import ClientCreate
from datetime import datetime

# ---------------------
# CLIENT CRUD
# ---------------------
def create_client(db: Session, client: ClientCreate):
    new_client = Client(
        username=client.username,
        contact_number=client.contact_number,
        email=client.email,
        first_name=client.first_name,
        middle_name=client.middle_name,
        last_name=client.last_name,
        gender=client.gender,
        password=client.password,
        date_created=datetime.utcnow()
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

def get_all_clients(db: Session):
    return db.query(Client).all()

# todo: change username to email
def authenticate_client(db: Session, username: str, password: str):
    return db.query(Client).filter_by(username=username, password=password).first()
