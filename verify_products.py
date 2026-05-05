from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, UserAllergy, Product
from app.main import get_products_with_risk
import json

def verify_products():
    db: Session = SessionLocal()
    try:
        test_email = "verify@test.com"
        
        # 1. Check if user exists
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            print("User not found, please run verify_intelligence.py first.")
            return

        # 2. Add SLS allergy if not present
        existing = db.query(UserAllergy).filter(UserAllergy.user_id == user.id, UserAllergy.allergen == "SLS").first()
        if not existing:
            db.add(UserAllergy(user_id=user.id, allergen="SLS"))
            db.commit()

        # 3. Test API logic
        print(f"Testing products for user: {test_email} (Allergies: Paraben, SLS)")
        results = get_products_with_risk(test_email, db)
        
        # 4. Assert Results
        # Face Wash has SLS -> High
        # Shampoo has SLS -> High
        # Moisturizer has Glycerin -> Low
        
        face_wash = next((p for p in results if p["name"] == "Face Wash"), None)
        shampoo = next((p for p in results if p["name"] == "Shampoo"), None)
        moisturizer = next((p for p in results if p["name"] == "Moisturizer"), None)

        if face_wash and face_wash["risk"] == "High" and shampoo and shampoo["risk"] == "High" and moisturizer and moisturizer["risk"] == "Low":
            print("✅ PRODUCT RISK VERIFICATION SUCCESSFUL!")
        else:
            print("❌ PRODUCT RISK VERIFICATION FAILED!")
            if face_wash: print(f"Face Wash Risk: {face_wash['risk']}")
            if shampoo: print(f"Shampoo Risk: {shampoo['risk']}")
            if moisturizer: print(f"Moisturizer Risk: {moisturizer['risk']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_products()
