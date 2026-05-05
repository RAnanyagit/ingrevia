from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as connection:
        # Restore name and price if they somehow got lost in neon, though Neon might still have them 
        # since we only changed the python model, but let's be safe.
        # Actually, we didn't drop them in Neon, so they are still there!
        
        print("Adding 'reviews' column...")
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN reviews INTEGER DEFAULT 0"))
            connection.commit()
        except Exception as e:
            print(f"Reviews column might already exist: {e}")

        print("Adding 'description' column...")
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN description TEXT"))
            connection.commit()
        except Exception as e:
            print(f"Description column might already exist: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
