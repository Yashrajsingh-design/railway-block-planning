from app.core.database import Base, engine
from app.models.block_request import BlockRequest


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")