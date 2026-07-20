from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Replays(Base):
    __tablename__ = "replays"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    event_id = Column(Integer, nullable=False)
    camera_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    start_timestamp = Column(DateTime(timezone=True), nullable=False)
    end_timestamp = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    replay_url = Column(String, nullable=True)
    type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)