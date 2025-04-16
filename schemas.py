from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import enum


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


class ClientBase(BaseModel):
    name: str
    email: EmailStr
    contact_number: Optional[str]
    address: Optional[str]

class ClientCreate(ClientBase):
    password: str

class ClientOut(ClientBase):
    client_id: int
    date_created: datetime

    model_config = {
        "from_attributes": True
    }



class SlotBase(BaseModel):
    slot_type: SlotTypeEnum
    availability: AvailabilityEnum
    price: float
    client_id: Optional[int]
    deceased_id: Optional[int]

class SlotCreate(SlotBase):
    pass

class SlotOut(SlotBase):
    slot_id: int

    model_config = {
        "from_attributes": True
    }


class DeceasedBase(BaseModel):
    name: str
    birth_date: datetime
    death_date: datetime
    slot_id: int
    client_id: int

class DeceasedCreate(DeceasedBase):
    pass

class DeceasedOut(DeceasedBase):
    deceased_id: int

    model_config = {
        "from_attributes": True
    }



class ContractBase(BaseModel):
    client_id: int
    slot_id: int
    payment_method: PaymentMethodEnum
    initial_price: float
    interest_rate: float
    down_payment: float
    years_to_pay: int  # in months
    final_price: float

class ContractCreate(ContractBase):
    pass

class ContractOut(ContractBase):
    order_id: int
    order_date: datetime

    model_config = {
        "from_attributes": True
    }
