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


class ContractSchema(BaseModel):
    order_id: int
    order_date: datetime
    client_id: int
    slot_id: int

    payment_method: PaymentMethodEnum
    contract_price: float
    vat_percent: float
    vat_amount: float
    price_with_vat: float
    admin_fee: float
    spot_cash_total: float

    interest_rate: float
    down_payment: float
    years_to_pay: int
    monthly_amortization: float
    final_price: float

    latest_payment_date: Optional[datetime]
    is_paid_on_time: bool
    is_paid: bool

    model_config = {
        "from_attributes": True
    }

class ContractCreate(BaseModel):
    client_id: int
    slot_id: int
    payment_method: PaymentMethodEnum

    contract_price: float
    vat_percent: float
    vat_amount: float
    price_with_vat: float
    admin_fee: float
    spot_cash_total: float

    interest_rate: float
    down_payment: float
    years_to_pay: int
    monthly_amortization: float
    final_price: float

    latest_payment_date: Optional[datetime] = None
    is_paid_on_time: Optional[bool] = True
    is_paid: Optional[bool] = False

class ContractUpdate(BaseModel):
    payment_method: Optional[PaymentMethodEnum] = None

    contract_price: Optional[float] = None
    vat_percent: Optional[float] = None
    vat_amount: Optional[float] = None
    price_with_vat: Optional[float] = None
    admin_fee: Optional[float] = None
    spot_cash_total: Optional[float] = None

    interest_rate: Optional[float] = None
    down_payment: Optional[float] = None
    years_to_pay: Optional[int] = None
    monthly_amortization: Optional[float] = None
    final_price: Optional[float] = None

    latest_payment_date: Optional[datetime] = None
    is_paid_on_time: Optional[bool] = None
    is_paid: Optional[bool] = None


