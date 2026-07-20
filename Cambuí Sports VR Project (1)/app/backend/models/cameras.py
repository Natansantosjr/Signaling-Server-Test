from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Cameras(Base):
    __tablename__ = "cameras"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    event_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    stream_url = Column(String, nullable=False)
    quality = Column(String, nullable=False)
    status = Column(String, nullable=False)
    is_primary = Column(Boolean, nullable=True, default=False, server_default='false')
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)