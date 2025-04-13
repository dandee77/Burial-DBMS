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
    reserved = "reserved"

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class AvailCodeEnum(str, enum.Enum):
    buy = "buy"
    reserve = "reserve"



# ? Models

# Client model
class Client(Base):
    __tablename__ = "Client"

    client_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    contact_number = Column(String)
    email = Column(String, unique=True)
    first_name = Column(String)
    middle_name = Column(String, nullable=True)
    last_name = Column(String)
    gender = Column(Enum(GenderEnum))
    date_created = Column(DateTime, default=datetime.datetime.utcnow)

# Admin model
class Admin(Base):
    __tablename__ = "Admin"

    admin_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password = Column(String)

# Slot model
class Slot(Base):
    __tablename__ = "Slot"

    slot_id = Column(Integer, primary_key=True, index=True)
    slot_type = Column(Enum(SlotTypeEnum))
    availability = Column(Enum(AvailabilityEnum))
    client_id = Column(Integer, ForeignKey("Client.client_id"), nullable=True)
    total_price = Column(Float)
    avail_code = Column(Enum(AvailCodeEnum))
    request_maintenance = Column(Boolean, default=False)
    password = Column(String)

    client = relationship("Client")
    plot = relationship("Plot", back_populates="slot", uselist=False)
    mausoleum = relationship("Mausoleum", back_populates="slot", uselist=False)

# Plot model
class Plot(Base):
    __tablename__ = "Plot"

    slot_id = Column(Integer, ForeignKey("Slot.slot_id"), primary_key=True)
    client_id = Column(Integer, ForeignKey("Client.client_id"), nullable=True)

    slot = relationship("Slot", back_populates="plot")
    client = relationship("Client")
    deceased = relationship("Deceased", back_populates="plot")

# Mausoleum model
class Mausoleum(Base):
    __tablename__ = "Mausoleum"

    slot_id = Column(Integer, ForeignKey("Slot.slot_id"), primary_key=True)
    client_id = Column(Integer, ForeignKey("Client.client_id"))

    slot = relationship("Slot", back_populates="mausoleum")
    client = relationship("Client")
    deceased = relationship("Deceased", back_populates="mausoleum")

# Deceased model
class Deceased(Base):
    __tablename__ = "Deceased"

    deceased_id = Column(Integer, primary_key=True)
    name = Column(String)
    birth_date = Column(DateTime)
    death_date = Column(DateTime)

    plot_id = Column(Integer, ForeignKey("Plot.slot_id"), nullable=True)
    mausoleum_id = Column(Integer, ForeignKey("Mausoleum.slot_id"), nullable=True)

    plot = relationship("Plot", back_populates="deceased")
    mausoleum = relationship("Mausoleum", back_populates="deceased")


############################################################################################

# Purchase model
class Purchase(Base):
    __tablename__ = "Purchase"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("Slot.slot_id"))
    price = Column(Float)
    interest_rate = Column(Float)
    years_to_pay = Column(Integer)
    down_payment = Column(Float)
    final_payment_per_period = Column(Float)

    slot = relationship("Slot")

# Reservation model
class Reservation(Base):
    __tablename__ = "Reservation"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("Slot.slot_id"))
    price = Column(Float)
    total_paid = Column(Float, default=0.0)
    refundable_deposit = Column(Float)
    interest_rate = Column(Float)
    years_to_pay = Column(Integer)

    slot = relationship("Slot")
