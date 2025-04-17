from datetime import datetime
from sqlalchemy.orm import Session
from models import Slot, Deceased, AvailabilityEnum, SlotTypeEnum
from database import SessionLocal

def seed_mock_data():
    db: Session = SessionLocal()

    db.query(Deceased).delete()
    db.query(Slot).delete()

    # Create sample slots
    slots = [
        Slot(slot_type=SlotTypeEnum.plot, availability=AvailabilityEnum.occupied, price=1000.0),
        Slot(slot_type=SlotTypeEnum.plot, availability=AvailabilityEnum.occupied, price=1000.0),
        Slot(slot_type=SlotTypeEnum.mausoleum, availability=AvailabilityEnum.occupied, price=5000.0),
    ]

    db.add_all(slots)
    db.commit()

    # Assign slot_ids
    db.refresh(slots[0])
    db.refresh(slots[1])
    db.refresh(slots[2])

    # Create sample deceased entries
    deceased = [
        Deceased(
            slot_id=slots[0].slot_id,
            client_id=1,
            name="John Doe",
            birth_date=datetime(1950, 1, 1),
            death_date=datetime(2020, 5, 15)
        ),
        Deceased(
            slot_id=slots[1].slot_id,
            client_id=1,
            name="Jane Smith",
            birth_date=datetime(1945, 6, 20),
            death_date=datetime(2018, 8, 9)
        ),
        Deceased(
            slot_id=slots[2].slot_id,
            client_id=1,
            name="Robert Brown",
            birth_date=datetime(1960, 3, 12),
            death_date=datetime(2022, 12, 30)
        )
    ]

    db.add_all(deceased)
    db.commit()

    slots[0].deceased_id = deceased[0].deceased_id
    slots[1].deceased_id = deceased[1].deceased_id
    slots[2].deceased_id = deceased[2].deceased_id
    db.commit()

    slots[0].client_id = 1
    slots[1].client_id = 1
    slots[2].client_id = 1
    db.commit()

    db.close()

    print("✅ Mock data seeded successfully.")


seed_mock_data()