from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import enum

# Enums
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

# Client
class ClientBase(BaseModel):
    username: str
    contact_number: Optional[str]
    email: EmailStr
    first_name: str
    middle_name: Optional[str]
    last_name: str
    gender: GenderEnum

class ClientCreate(ClientBase):
    password: str

class ClientOut(ClientBase):
    client_id: int
    date_created: datetime

    class Config:
        orm_mode = True

# Admin
class AdminBase(BaseModel):
    username: str

class AdminCreate(AdminBase):
    password: str

class AdminOut(AdminBase):
    admin_id: int

    class Config:
        orm_mode = True

# Block
class BlockBase(BaseModel):
    pass

class BlockCreate(BlockBase):
    pass

class BlockOut(BlockBase):
    block_id: int

    class Config:
        orm_mode = True

# Slot
class SlotBase(BaseModel):
    slot_type: SlotTypeEnum
    availability: AvailabilityEnum
    total_price: float
    avail_code: AvailCodeEnum
    request_maintenance: Optional[bool] = False
    password: str
    client_id: Optional[int]
    block_id: Optional[int]

class SlotCreate(SlotBase):
    pass

class SlotOut(SlotBase):
    slot_id: int

    class Config:
        orm_mode = True

# Plot
class PlotBase(BaseModel):
    client_id: Optional[int]

class PlotCreate(PlotBase):
    slot_id: int

class PlotOut(PlotBase):
    slot_id: int

    class Config:
        orm_mode = True

# Mausoleum
class MausoleumBase(BaseModel):
    client_id: int

class MausoleumCreate(MausoleumBase):
    slot_id: int

class MausoleumOut(MausoleumBase):
    slot_id: int

    class Config:
        orm_mode = True

# Deceased
class DeceasedBase(BaseModel):
    name: str
    birth_date: datetime
    death_date: datetime
    plot_id: Optional[int]
    mausoleum_id: Optional[int]

class DeceasedCreate(DeceasedBase):
    pass

class DeceasedOut(DeceasedBase):
    deceased_id: int

    class Config:
        orm_mode = True

# Purchase
class PurchaseBase(BaseModel):
    slot_id: int
    price: float
    interest_rate: float
    years_to_pay: int
    down_payment: float
    final_payment_per_period: float

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseOut(PurchaseBase):
    id: int

    class Config:
        orm_mode = True

# Reservation
class ReservationBase(BaseModel):
    slot_id: int
    price: float
    total_paid: float
    refundable_deposit: float
    interest_rate: float
    years_to_pay: int

class ReservationCreate(ReservationBase):
    pass

class ReservationOut(ReservationBase):
    id: int

    class Config:
        orm_mode = True
