from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import IngredientMapping, Base

# Ensure table exists
Base.metadata.create_all(bind=engine)

def seed_mappings():
    db: Session = SessionLocal()
    try:
        # Clear existing mappings for a fresh seed
        print("Clearing mapping table...")
        db.query(IngredientMapping).delete()
        db.commit()

        # Check if already seeded
        mappings = [
            IngredientMapping(ingredient_name='Methylparaben', normalized_name='Paraben', family='Preservative'),
            IngredientMapping(ingredient_name='Ethylparaben', normalized_name='Paraben', family='Preservative'),
            IngredientMapping(ingredient_name='Propylparaben', normalized_name='Paraben', family='Preservative'),
            IngredientMapping(ingredient_name='Butylparaben', normalized_name='Paraben', family='Preservative'),
            IngredientMapping(ingredient_name='Parfum', normalized_name='Fragrance', family='Fragrance'),
            IngredientMapping(ingredient_name='Sodium Lauryl Sulfate', normalized_name='SLS', family='Surfactant'),
            IngredientMapping(ingredient_name='Sodium Laureth Sulfate', normalized_name='SLES', family='Surfactant'),
            IngredientMapping(ingredient_name='Aqua', normalized_name='Water', family='Solvent'),
            IngredientMapping(ingredient_name='Tocopherol', normalized_name='Vitamin E', family='Antioxidant'),
            IngredientMapping(ingredient_name='Ascorbic Acid', normalized_name='Vitamin C', family='Antioxidant'),
            IngredientMapping(ingredient_name='Alcohol Denat', normalized_name='Alcohol', family='Solvent'),
            IngredientMapping(ingredient_name='Dimethicone', normalized_name='Silicone', family='Emollient'),
        ]

        db.add_all(mappings)
        db.commit()
        print("Successfully seeded ingredient mappings!")
    except Exception as e:
        print(f"Error seeding mappings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_mappings()
