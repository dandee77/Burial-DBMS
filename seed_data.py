import random
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.orm import Session
from database import SessionLocal, Base
from models import Client, Slot, Deceased, Contract, SlotTypeEnum, AvailabilityEnum, PaymentMethodEnum

fake = Faker()

def generate_random_date(start_year=1920, end_year=2000):
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def compute_contract_details(slot_type: str, years_to_pay: int = None):
    if slot_type == "plot":
        contract_price = 300_000.00
        admin_fee = 5_000.00
    else:
        contract_price = 10_000_000.00
        admin_fee = 25_000.00

    vat_percent = 0.12
    vat_amount = contract_price * vat_percent
    price_with_vat = contract_price + vat_amount
    spot_cash_total = price_with_vat + admin_fee

    down_payment = price_with_vat * 0.20
    interest_rate = 0.00525 if years_to_pay == 60 else 0.00623 if years_to_pay == 120 else 0.0034286
    monthly_amortization = 0.0
    final_price = spot_cash_total

    if years_to_pay:
        n = years_to_pay 
        P = price_with_vat - down_payment
        i = interest_rate
        A = (P * i * ((1 + i) ** n)) / (((1 + i) ** n) - 1)
        monthly_amortization = round(A, 2)
        final_price = round(monthly_amortization * n + down_payment, 2)

    return {
        "contract_price": contract_price,
        "vat_percent": vat_percent,
        "vat_amount": vat_amount,
        "price_with_vat": price_with_vat,
        "admin_fee": admin_fee,
        "spot_cash_total": spot_cash_total,
        "down_payment": down_payment,
        "interest_rate": interest_rate if years_to_pay else 0.0,
        "monthly_amortization": monthly_amortization,
        "final_price": final_price,
    }

def seed_full_database():
    db: Session = SessionLocal()
    
    # Clear existing data and recreate tables
    try:
        print("Dropping and recreating tables...")
        Base.metadata.drop_all(bind=db.get_bind())
        Base.metadata.create_all(bind=db.get_bind())
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
        return

    # Create clients
    clients = []
    for i in range(1, 506):
        client = Client(
            name=fake.name(),
            email=f"client{i}@example.com",
            password="hashedpassword123",
            contact_number=fake.phone_number(),
            address=fake.address(), 
        )
        db.add(client)
        clients.append(client)
    
    db.commit()
    print(f"Created {len(clients)} clients")

    # Create slots and associated data
    deceased_counter = 1
    total_contracts = 0

    for i in range(506):
        is_mausoleum = i >= 476
        slot_type = SlotTypeEnum.mausoleum if is_mausoleum else SlotTypeEnum.plot
        is_occupied = random.choice([True, False])
        availability = AvailabilityEnum.occupied if is_occupied else AvailabilityEnum.available
        client = random.choice(clients) if is_occupied else None

        slot = Slot(
            slot_id=i,
            slot_type=slot_type,
            availability=availability,
            price=0.0,  # Price is set in contract
            client_id=client.client_id if client else None,
            deceased_id=None
        )
        db.add(slot)
        db.flush()  # Ensure slot gets ID before creating related records

        if is_occupied and client:
            # Create deceased records
            num_deceased = 1 if not is_mausoleum else random.randint(2, 5)
            deceased_ids = []
            
            for _ in range(num_deceased):
                birth = generate_random_date()
                death = birth + timedelta(days=random.randint(20000, 30000))
                full_name = fake.name()
                
                deceased = Deceased(
                    deceased_id=deceased_counter,
                    slot_id=slot.slot_id,
                    client_id=client.client_id,
                    name=full_name,
                    birth_date=birth,
                    death_date=death
                )
                db.add(deceased)
                deceased_ids.append(deceased_counter)
                deceased_counter += 1
            
            # Set the first deceased as the slot's primary deceased
            if deceased_ids:
                slot.deceased_id = deceased_ids[0]
                db.add(slot)

            # Create contract
            full_paid = random.choice([True, False])
            years_to_pay = None if full_paid else random.choice([3, 5, 10])
            details = compute_contract_details(slot_type=slot_type.value, years_to_pay=years_to_pay * 12 if years_to_pay else None)
            
            contract = Contract(
                order_date=datetime.now(),
                client_id=client.client_id,
                slot_id=slot.slot_id,
                payment_method=random.choice(list(PaymentMethodEnum)),
                contract_price=details["contract_price"],
                vat_percent=details["vat_percent"],
                vat_amount=details["vat_amount"],
                price_with_vat=details["price_with_vat"],
                admin_fee=details["admin_fee"],
                spot_cash_total=details["spot_cash_total"],
                interest_rate=details["interest_rate"],
                down_payment=details["down_payment"],
                years_to_pay=years_to_pay * 12 if years_to_pay else 0,
                monthly_amortization=details["monthly_amortization"],
                final_price=details["final_price"],
                latest_payment_date=datetime.now() if full_paid else None,
                is_paid_on_time=True,
                is_paid=full_paid
            )
            db.add(contract)
            total_contracts += 1

        if i % 100 == 0:
            db.commit()

    db.commit()
    db.close()
    
    print(f"✅ Database seeded successfully!")
    print(f"Total clients: {len(clients)}")
    print(f"Total slots: 506")
    print(f"Total contracts: {total_contracts}")
    print(f"Total deceased records: {deceased_counter-1}")

if __name__ == "__main__":
    seed_full_database()