from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Chemical

def check_chemicals():
    db = SessionLocal()
    chemicals = db.query(Chemical).all()
    print(f"Total chemicals in DB: {len(chemicals)}")
    for c in chemicals[:10]:
        print(f"- {c.name}: Risk {c.risk_score}, Cat: {c.risk_category}, Base: {c.risk_score}")
    db.close()

if __name__ == "__main__":
    check_chemicals()
