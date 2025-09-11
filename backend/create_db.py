# Create a file called update_db.py and run it once
from db import engine, Base
from models import MysteryCase, Job, GameSession

# This will create the new GameSession table
Base.metadata.create_all(bind=engine)
print("Database updated successfully!")
