from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String


class Analytics_metrics(Base):
    __tablename__ = "analytics_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    event_id = Column(Integer, nullable=False)
    total_viewers = Column(Integer, nullable=False, default=0, server_default='0')
    peak_viewers = Column(Integer, nullable=False, default=0, server_default='0')
    avg_watch_time_seconds = Column(Integer, nullable=True, default=0, server_default='0')
    most_watched_camera = Column(String, nullable=True)
    replay_count = Column(Integer, nullable=True, default=0, server_default='0')
    abandonment_rate = Column(Float, nullable=True, default=0, server_default='0')
    revenue = Column(Float, nullable=True, default=0, server_default='0')
    recorded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)