from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Product, Base
import random

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_products():
    db: Session = SessionLocal()
    
    print("Clearing Products database for Balanced Risk Seed...")
    db.query(Product).delete()
    db.commit()
    
    # Mapping Categories to the user's specific filenames in frontend assets
    mapping = {
        "Cleanser": "cleanser.png",
        "Moisturizer": "lotion.png",
        "Serum": "serum.png",
        "Sunscreen": "sunscreen.png",
        "Shampoo": "shampoo.png"
    }

    # 🚀 EXPANDED INGREDIENT POOLS
    # Low Risk (Safe)
    safe_list = [
        "Water, Glycerin, Niacinamide, Hyaluronic Acid, Ceramides",
        "Aqua, Aloe Vera, Squalane, Vitamin E, Panthenol",
        "Glycerin, Shea Butter, Jojoba Oil, Ceramides, Allantoin",
        "Aqua, Green Tea Extract, Chamomile Extract, Colloidal Oatmeal",
        "Water, Vitamin C, Niacinamide, Hyaluronic Acid, Vitamin E"
    ]
    # Medium Risk (Caution)
    medium_list = [
        "Water, Fragrance, Phenoxyethanol, Alcohol Denat, SLES",
        "Retinol, Water, Glycerin, Dimethicone, BHT",
        "Aqua, Salicylic Acid, Sodium Laureth Sulfate, Paraffin, Parfum",
        "Water, Benzoyl Peroxide, TEA, Silicone, Phenoxyethanol",
        "Aqua, Mineral Oil, DEA, Retinol, Fragrance"
    ]
    # High Risk (Danger)
    high_list = [
        "Water, Methylparaben, Formaldehyde, Oxybenzone, SLS",
        "Aqua, Sodium Lauryl Sulfate, Triclosan, Propylparaben, Parfum",
        "Propylparaben, Formaldehyde, SLS, Phthalates, Oxybenzone",
        "Aqua, Hydroquinone, Lead, Ethylparaben, Toluene",
        "Mercury, Coal Tar, PFAS, Butylparaben, SLS"
    ]

    categories = list(mapping.keys())
    brands = ["PureGlow", "DermaSafe", "BioActive", "NatureForce", "OceanSilk"]

    print("Generating 50 products with diversified risk and local assets...")
    for i in range(50):
        cat_name = categories[i % len(categories)]
        img_filename = mapping[cat_name]
        brand = brands[i % len(brands)]
        
        # Decide risk distribution
        if i % 3 == 0:
            ingredients = random.choice(safe_list) # Low
        elif i % 3 == 1:
            ingredients = random.choice(medium_list) # Medium
        else:
            ingredients = random.choice(high_list) # High
            
        name = f"{brand} {cat_name} {i+1:02d}"
        image_url = f"/assets/products/{img_filename}"
        
        db_product = Product(
            name=name,
            price=random.randint(499, 2999),
            ingredients=ingredients,
            brand=brand,
            image_url=image_url,
            rating=round(random.uniform(3.8, 5.0), 1),
            reviews=random.randint(200, 8000),
            description=f"A professional grade {cat_name.lower()} formulated with active ingredients for skincare health."
        )
        db.add(db_product)

    db.commit()
    db.close()
    print("SUCCESS: 50 Diversified products seeded with local assets!")

if __name__ == "__main__":
    seed_products()
