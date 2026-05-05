from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Chemical, Base

def seed_chemicals():
    db = SessionLocal()
    
    # 🚨 DANGER: Clear old chemicals for a clean slate
    print("Clearing Chemicals database...")
    db.query(Chemical).delete()
    db.commit()

    test_chemicals = [
        # HIGH/CRITICAL RISK
        {"name": "SLS", "risk_score": 85, "risk_category": "High", "irritation_index": 8, "regulatory_status": "Restricted"},
        {"name": "Sodium Lauryl Sulfate", "risk_score": 85, "risk_category": "High", "irritation_index": 8},
        {"name": "Paraben", "risk_score": 75, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Methylparaben", "risk_score": 70, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Ethylparaben", "risk_score": 70, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Propylparaben", "risk_score": 80, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Butylparaben", "risk_score": 85, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Oxybenzone", "risk_score": 90, "risk_category": "Critical", "endocrine_disruptor": True, "carcinogenic_flag": True},
        {"name": "Formaldehyde", "risk_score": 95, "risk_category": "Critical", "carcinogenic_flag": True, "regulatory_status": "Banned"},
        {"name": "Triclosan", "risk_score": 80, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "Coal Tar", "risk_score": 90, "risk_category": "Critical", "carcinogenic_flag": True},
        {"name": "Hydroquinone", "risk_score": 85, "risk_category": "High", "regulatory_status": "Restricted"},
        {"name": "Lead", "risk_score": 100, "risk_category": "Critical", "carcinogenic_flag": True},
        {"name": "Mercury", "risk_score": 100, "risk_category": "Critical", "regulatory_status": "Banned"},
        {"name": "Toluene", "risk_score": 85, "risk_category": "High", "irritation_index": 7},
        {"name": "Phthalates", "risk_score": 80, "risk_category": "High", "endocrine_disruptor": True},
        {"name": "PFAS", "risk_score": 90, "risk_category": "Critical", "endocrine_disruptor": True},
        
        # MEDIUM RISK
        {"name": "Fragrance", "risk_score": 55, "risk_category": "Medium", "irritation_index": 6},
        {"name": "Parfum", "risk_score": 55, "risk_category": "Medium", "irritation_index": 6},
        {"name": "Phenoxyethanol", "risk_score": 45, "risk_category": "Medium", "irritation_index": 3},
        {"name": "Retinol", "risk_score": 50, "risk_category": "Medium", "irritation_index": 5},
        {"name": "Alcohol Denat", "risk_score": 40, "risk_category": "Medium", "irritation_index": 4},
        {"name": "BHT", "risk_score": 45, "risk_category": "Medium", "endocrine_disruptor": True},
        {"name": "BHA", "risk_score": 50, "risk_category": "Medium", "endocrine_disruptor": True},
        {"name": "TEA", "risk_score": 40, "risk_category": "Medium", "irritation_index": 3},
        {"name": "DEA", "risk_score": 50, "risk_category": "Medium", "irritation_index": 4},
        {"name": "SLES", "risk_score": 35, "risk_category": "Medium", "irritation_index": 3},
        {"name": "Sodium Laureth Sulfate", "risk_score": 35, "risk_category": "Medium", "irritation_index": 3},
        {"name": "Mineral Oil", "risk_score": 30, "risk_category": "Medium"},
        {"name": "Paraffin", "risk_score": 30, "risk_category": "Medium"},
        {"name": "Silicone", "risk_score": 35, "risk_category": "Medium"},
        {"name": "Dimethicone", "risk_score": 30, "risk_category": "Medium"},
        {"name": "Salicylic Acid", "risk_score": 40, "risk_category": "Medium", "irritation_index": 3},
        {"name": "Benzoyl Peroxide", "risk_score": 45, "risk_category": "Medium", "irritation_index": 4},

        # LOW RISK
        {"name": "Glycerin", "risk_score": 5, "risk_category": "Low", "irritation_index": 0},
        {"name": "Niacinamide", "risk_score": 0, "risk_category": "Low", "irritation_index": 0},
        {"name": "Hyaluronic Acid", "risk_score": 0, "risk_category": "Low", "irritation_index": 0},
        {"name": "Aloe Vera", "risk_score": 0, "risk_category": "Low", "irritation_index": 0},
        {"name": "Water", "risk_score": 0, "risk_category": "Low", "irritation_index": 0},
        {"name": "Aqua", "risk_score": 0, "risk_category": "Low", "irritation_index": 0},
        {"name": "Vitamin E", "risk_score": 5, "risk_category": "Low"},
        {"name": "Tocopherol", "risk_score": 5, "risk_category": "Low"},
        {"name": "Vitamin C", "risk_score": 5, "risk_category": "Low"},
        {"name": "Ascorbic Acid", "risk_score": 5, "risk_category": "Low"},
        {"name": "Green Tea Extract", "risk_score": 0, "risk_category": "Low"},
        {"name": "Ceramides", "risk_score": 0, "risk_category": "Low"},
        {"name": "Panthenol", "risk_score": 0, "risk_category": "Low"},
        {"name": "Allantoin", "risk_score": 0, "risk_category": "Low"},
        {"name": "Jojoba Oil", "risk_score": 0, "risk_category": "Low"},
        {"name": "Shea Butter", "risk_score": 0, "risk_category": "Low"},
        {"name": "Squalane", "risk_score": 0, "risk_category": "Low"},
        {"name": "Chamomile Extract", "risk_score": 0, "risk_category": "Low"},
        {"name": "Colloidal Oatmeal", "risk_score": 0, "risk_category": "Low"}
    ]

    print(f"Seeding {len(test_chemicals)} chemicals...")
    for c in test_chemicals:
        db_chem = Chemical(**c)
        db.add(db_chem)
    
    db.commit()
    db.close()
    print("Chemicals seeded successfully!")

if __name__ == "__main__":
    seed_chemicals()
