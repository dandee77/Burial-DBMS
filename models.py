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

    contracts = relationship("Contract", back_populates="client")


class Slot(Base):
    __tablename__ = "Slot"

    slot_id = Column(Integer, primary_key=True, index=True)
    slot_type = Column(Enum(SlotTypeEnum))
    client_id = Column(Integer, ForeignKey("Client.client_id"), nullable=True)
    availability = Column(Enum(AvailabilityEnum))
    price = Column(Float)
    deceased_id = Column(Integer, ForeignKey("Deceased.deceased_id"), nullable=True)

    contracts = relationship("Contract", back_populates="slot")


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

    # Foreign keys
    client_id = Column(Integer, ForeignKey("Client.client_id"))
    slot_id = Column(Integer, ForeignKey("Slot.slot_id"))

    # Payment
    payment_method = Column(Enum(PaymentMethodEnum))
    contract_price = Column(Float)                        # Price after admin adjustments
    vat_percent = Column(Float, default=12.0)             # VAT % (usually 12)
    vat_amount = Column(Float)                            # Computed VAT amount
    price_with_vat = Column(Float)                        # Total price with VAT
    admin_fee = Column(Float)                          # Admin/Transfer fee
    spot_cash_total = Column(Float)                       # If paid spot cash (price with vat + admin fee)

    # Installment payment-related
    interest_rate = Column(Float)                         # Annual or monthly interest rate
    down_payment = Column(Float)                          # Down payment value
    years_to_pay = Column(Integer)                        # Number of years for payment (in months)
    monthly_amortization = Column(Float)                  # Monthly amortization based on rate

    final_price = Column(Float)                           # Final amount after interest
    latest_payment_date = Column(DateTime, nullable=True) # Last time user paid
    is_paid_on_time = Column(Boolean, default=True)       # Status tracking
    is_paid = Column(Boolean, default=False)              # If completely paid

    slot = relationship("Slot", back_populates="contracts")
    client = relationship("Client", back_populates="contracts")
