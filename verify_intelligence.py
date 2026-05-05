from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, UserAllergy, IngredientMapping
from app.main import analyze_list
from app.schemas import IngredientListRequest
import json

def verify_intelligence():
    db: Session = SessionLocal()
    try:
        # 1. Setup Test User & Allergy
        test_email = "verify@test.com"
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(name="Verify User", email=test_email, password="password")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Add Paraben allergy
        # Check if already exists
        existing = db.query(UserAllergy).filter(UserAllergy.user_id == user.id, UserAllergy.allergen == "Paraben").first()
        if not existing:
            db.add(UserAllergy(user_id=user.id, allergen="Paraben"))
            db.commit()

        # 2. Mock Request
        request_data = IngredientListRequest(
            ingredients="Methylparaben, Glycerin",
            user_email=test_email
        )

        # 3. Call endpoint logic directly
        print(f"Testing with ingredients: {request_data.ingredients} and user allergy: Paraben")
        response = analyze_list(request_data, db)
        
        # 4. Assert results
        result = response["product_analysis"]
        print(f"Result Category: {result['overall_risk_category']}")
        print(f"Reasoning: {result['analysis_reasoning']}")

        if result['overall_risk_category'] == "High" and "Paraben family" in result['analysis_reasoning']:
            print("✅ VERIFICATION SUCCESSFUL: Intelligence mapping worked!")
        else:
            print("❌ VERIFICATION FAILED: Logic did not produce 'High' risk or correct reasoning.")

    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_intelligence()
