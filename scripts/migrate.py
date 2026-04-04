import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    migration_path = os.path.join('migrations', '002_new_features.sql')
    if not os.path.exists(migration_path):
        print(f"Error: Migration file not found at {migration_path}")
        return

    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print(f"Reading migration script: {migration_path}")
        with open(migration_path, 'r') as f:
            sql = f.read()
        
        print("Executing migration... (this may take a few seconds)")
        cur.execute(sql)
        conn.commit()
        
        print("✅ Migration successful! All new tables and schema changes applied.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
