import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.analytics_metrics import Analytics_metrics

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Analytics_metricsService:
    """Service layer for Analytics_metrics operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Analytics_metrics]:
        """Create a new analytics_metrics"""
        try:
            obj = Analytics_metrics(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created analytics_metrics with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating analytics_metrics: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Analytics_metrics]:
        """Get analytics_metrics by ID"""
        try:
            query = select(Analytics_metrics).where(Analytics_metrics.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching analytics_metrics {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of analytics_metricss"""
        try:
            query = select(Analytics_metrics)
            count_query = select(func.count(Analytics_metrics.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Analytics_metrics, field):
                        query = query.where(getattr(Analytics_metrics, field) == value)
                        count_query = count_query.where(getattr(Analytics_metrics, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Analytics_metrics, field_name):
                        query = query.order_by(getattr(Analytics_metrics, field_name).desc())
                else:
                    if hasattr(Analytics_metrics, sort):
                        query = query.order_by(getattr(Analytics_metrics, sort))
            else:
                query = query.order_by(Analytics_metrics.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching analytics_metrics list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Analytics_metrics]:
        """Update analytics_metrics"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Analytics_metrics {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated analytics_metrics {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating analytics_metrics {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete analytics_metrics"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Analytics_metrics {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted analytics_metrics {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting analytics_metrics {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Analytics_metrics]:
        """Get analytics_metrics by any field"""
        try:
            if not hasattr(Analytics_metrics, field_name):
                raise ValueError(f"Field {field_name} does not exist on Analytics_metrics")
            result = await self.db.execute(
                select(Analytics_metrics).where(getattr(Analytics_metrics, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching analytics_metrics by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Analytics_metrics]:
        """Get list of analytics_metricss filtered by field"""
        try:
            if not hasattr(Analytics_metrics, field_name):
                raise ValueError(f"Field {field_name} does not exist on Analytics_metrics")
            result = await self.db.execute(
                select(Analytics_metrics)
                .where(getattr(Analytics_metrics, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Analytics_metrics.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching analytics_metricss by {field_name}: {str(e)}")
            raise