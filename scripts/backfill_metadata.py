import sys
import os

# Add parent directory to path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import get_db_cursor
from app.services.tag_service import TagService

app = create_app()

# Mapping rules dictionary
RULES = {
    'netflix':      {'category': 'Entertainment', 'tags': ['subscription', 'leisure', 'streaming']},
    'spotify':      {'category': 'Entertainment', 'tags': ['subscription', 'leisure', 'music']},
    'salary':       {'category': 'Income',        'tags': ['essentials', 'paycheck']},
    'grocery':      {'category': 'Food',          'tags': ['essentials', 'groceries']},
    'market':       {'category': 'Food',          'tags': ['essentials', 'groceries']},
    'restaurant':   {'category': 'Food',          'tags': ['leisure', 'dining']},
    'rent':         {'category': 'Housing',       'tags': ['essentials', 'monthly', 'rent']},
    'uber':         {'category': 'Transport',     'tags': ['commute', 'taxi']},
    'lyft':         {'category': 'Transport',     'tags': ['commute', 'taxi']},
    'bus':          {'category': 'Transport',     'tags': ['commute', 'public-transit']},
    'electricity':  {'category': 'Utilities',     'tags': ['essentials', 'monthly', 'bills']},
    'water bill':   {'category': 'Utilities',     'tags': ['essentials', 'monthly', 'bills']},
    'internet':     {'category': 'Utilities',     'tags': ['essentials', 'monthly', 'bills']},
    'gym':          {'category': 'Health',        'tags': ['fitness', 'subscription']},
    'pharmacy':     {'category': 'Health',        'tags': ['medical', 'essentials']},
    'freelance':    {'category': 'Income',        'tags': ['side-hustle', 'freelance']},
    'dividend':     {'category': 'Income',        'tags': ['investments', 'passive']},
    'coffee':       {'category': 'Food',          'tags': ['leisure', 'cafe']},
    'starbucks':    {'category': 'Food',          'tags': ['leisure', 'cafe']},
}

def backfill():
    with app.app_context():
        # First ensure categories exist globally or per user context.
        # But wait, Categories and Tags are user-specific, so we need to process them per user!
        
        with get_db_cursor(commit=True) as cursor:
            # Get all users to bind their tags/categories properly
            cursor.execute("SELECT id FROM users")
            users = cursor.fetchall()
            user_ids = [u['id'] for u in users]
            
            # Fetch all transactions 
            cursor.execute("SELECT id, created_by, notes FROM transactions WHERE is_deleted = false")
            transactions = cursor.fetchall()

            updates_count = 0

            for tx in transactions:
                uid = tx['created_by']
                notes = (tx['notes'] or '').strip().lower()
                
                matched_category_name = None
                matched_tags = []

                # Find first matching rule
                for keyword, mapping in RULES.items():
                    if keyword in notes:
                        matched_category_name = mapping['category']
                        matched_tags = mapping['tags']
                        break
                
                if not matched_category_name:
                    # Provide defaults based on type maybe? or skip
                    continue
                
                cursor.execute("SELECT id FROM categories WHERE name = %s", (matched_category_name,))
                row = cursor.fetchone()
                if row:
                    cat_id = row['id']
                else:
                    cursor.execute(
                        "INSERT INTO categories (name, created_by) VALUES (%s, %s) RETURNING id",
                        (matched_category_name, uid)
                    )
                    cat_id = cursor.fetchone()['id']

                # Update transaction category_id
                cursor.execute(
                    "UPDATE transactions SET category_id = %s WHERE id = %s",
                    (cat_id, tx['id'])
                )
                
                # Assign Tags
                for tag_name in matched_tags:
                    tag, _ = TagService.create_tag(tag_name, uid)
                    cursor.execute(
                        "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (tx['id'], tag['id'])
                    )
                    
                updates_count += 1
                
        print(f"Backfill complete! Updated {updates_count} transactions with realistic tags and categories.")

if __name__ == '__main__':
    backfill()
