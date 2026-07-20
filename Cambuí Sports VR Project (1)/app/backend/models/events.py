from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Events(Base):
    __tablename__ = "events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    title = Column(String, nullable=False)
    competition = Column(String, nullable=False)
    team_home = Column(String, nullable=False)
    team_away = Column(String, nullable=False)
    stadium = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False)
    viewers_count = Column(Integer, nullable=True, default=0, server_default='0')
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)