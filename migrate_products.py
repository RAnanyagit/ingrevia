from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as connection:
        print("Adding 'brand' column...")
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN brand VARCHAR(255)"))
            connection.commit()
        except Exception as e:
            print(f"Brand column might already exist: {e}")

        print("Adding 'image_url' column...")
        try:
            connection.execute(text("ALTER TABLE products ADD COLUMN image_url TEXT"))
            connection.commit()
        except Exception as e:
            print(f"Image_url column might already exist: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
