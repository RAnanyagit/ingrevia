from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as connection:
        print("Adding 'rating' column...")
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN rating FLOAT DEFAULT 0.0"))
            connection.commit()
        except Exception as e:
            print(f"Rating column might already exist: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
