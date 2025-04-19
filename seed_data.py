import random
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Client, Slot, Deceased, SlotTypeEnum, AvailabilityEnum

"""
This script seeds the database with random data for clients, slots, and deceased individuals.
It uses the Faker library to generate realistic names, addresses, and other personal information.
"""

fake = Faker()

def generate_random_date(start_year=1920, end_year=2000):
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def seed_full_database():
    db: Session = SessionLocal()

    # Clean tables
    db.query(Deceased).delete()
    db.query(Slot).delete()
    db.query(Client).delete()

    db.commit()

    clients = []
    for i in range(1, 506):
        client = Client(
            name=fake.name(),
            email=f"client{i}@example.com",
            password="hashedpassword123",
            contact_number=fake.phone_number(),
            address=fake.address(),
        )
        clients.append(client)

    db.add_all(clients)
    db.commit()

    for client in clients:
        db.refresh(client)

    slots = []
    deceased_list = []
    deceased_counter = 1

    for i in range(506):
        is_mausoleum = i >= 476
        slot_type = SlotTypeEnum.mausoleum if is_mausoleum else SlotTypeEnum.plot

        # Randomly decide if this slot is available or occupied
        is_occupied = random.choice([True, False])
        availability = AvailabilityEnum.occupied if is_occupied else AvailabilityEnum.available

        # Price ranges
        price = round(random.uniform(800.0, 1500.0), 2) if slot_type == SlotTypeEnum.plot else round(random.uniform(4000.0, 6000.0), 2)

        # Assign a client only if occupied
        client = random.choice(clients) if is_occupied else None

        slot = Slot(
            slot_id=i,
            slot_type=slot_type,
            availability=availability,
            price=price,
            client_id=client.client_id if client else None,
            deceased_id=None  # Will be set after deceased creation
        )

        db.add(slot)
        db.flush()  # get slot_id

        # If occupied, add deceased(s)
        if is_occupied:
            num_deceased = 1 if not is_mausoleum else random.randint(2, 5)
            for _ in range(num_deceased):
                birth = generate_random_date()
                death = birth + timedelta(days=random.randint(20000, 30000))
                deceased = Deceased(
                    deceased_id=deceased_counter,
                    slot_id=i,
                    client_id=client.client_id,
                    name=fake.name(),
                    birth_date=birth,
                    death_date=death
                )
                deceased_list.append(deceased)
                if not slot.deceased_id:
                    slot.deceased_id = deceased_counter  # Assign first one only
                deceased_counter += 1

        slots.append(slot)

    db.add_all(deceased_list)
    db.commit()
    db.close()

    print("✅ Full database seeded with clients, slots, and deceased!")

# Run seeding function
if __name__ == "__main__":
    seed_full_database()
