from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime
)
from sqlalchemy.orm import relationship
from database import Base
import enum
import datetime


# ? Enums
class SlotTypeEnum(str, enum.Enum):
    plot = "plot"
    mausoleum = "mausoleum"

class AvailabilityEnum(str, enum.Enum):
    available = "available"
    occupied = "occupied"

class PaymentMethodEnum(str, enum.Enum):
    cash = "cash"
    online = "online"
    bank_transfer = "bank_transfer"


# ? Models
class Client(Base):
    __tablename__ = "Client"

    client_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    contact_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    date_created = Column(DateTime, default=datetime.datetime.utcnow)


class Slot(Base):
    __tablename__ = "Slot"

    slot_id = Column(Integer, primary_key=True, index=True)
    slot_type = Column(Enum(SlotTypeEnum))
    client_id = Column(Integer, ForeignKey("Client.client_id"), nullable=True)
    availability = Column(Enum(AvailabilityEnum))
    price = Column(Float)
    deceased_id = Column(Integer, ForeignKey("Deceased.deceased_id"), nullable=True)


class Deceased(Base):
    __tablename__ = "Deceased"

    deceased_id = Column(Integer, primary_key=True)
    slot_id = Column(Integer, ForeignKey("Slot.slot_id"))
    client_id = Column(Integer, ForeignKey("Client.client_id"))
    name = Column(String)
    birth_date = Column(DateTime)
    death_date = Column(DateTime)


class Contract(Base):
    __tablename__ = "Contract"

    order_id = Column(Integer, primary_key=True, index=True)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    client_id = Column(Integer, ForeignKey("Client.client_id"))
    slot_id = Column(Integer, ForeignKey("Slot.slot_id"))    
    payment_method = Column(Enum(PaymentMethodEnum))

    initial_price = Column(Float) # (plot or mausoleum)
    interest_rate = Column(Float) 
    down_payment = Column(Float)
    years_to_pay = Column(Integer) # in months
    final_price = Column(Float)
