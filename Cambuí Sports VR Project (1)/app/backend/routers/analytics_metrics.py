import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.analytics_metrics import Analytics_metricsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/analytics_metrics", tags=["analytics_metrics"])


# ---------- Pydantic Schemas ----------
class Analytics_metricsData(BaseModel):
    """Entity data schema (for create/update)"""
    event_id: int
    total_viewers: int
    peak_viewers: int
    avg_watch_time_seconds: int = None
    most_watched_camera: str = None
    replay_count: int = None
    abandonment_rate: float = None
    revenue: float = None
    recorded_at: Optional[datetime] = None


class Analytics_metricsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    event_id: Optional[int] = None
    total_viewers: Optional[int] = None
    peak_viewers: Optional[int] = None
    avg_watch_time_seconds: Optional[int] = None
    most_watched_camera: Optional[str] = None
    replay_count: Optional[int] = None
    abandonment_rate: Optional[float] = None
    revenue: Optional[float] = None
    recorded_at: Optional[datetime] = None


class Analytics_metricsResponse(BaseModel):
    """Entity response schema"""
    id: int
    event_id: int
    total_viewers: int
    peak_viewers: int
    avg_watch_time_seconds: Optional[int] = None
    most_watched_camera: Optional[str] = None
    replay_count: Optional[int] = None
    abandonment_rate: Optional[float] = None
    revenue: Optional[float] = None
    recorded_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Analytics_metricsListResponse(BaseModel):
    """List response schema"""
    items: List[Analytics_metricsResponse]
    total: int
    skip: int
    limit: int


class Analytics_metricsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Analytics_metricsData]


class Analytics_metricsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Analytics_metricsUpdateData


class Analytics_metricsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Analytics_metricsBatchUpdateItem]


class Analytics_metricsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Analytics_metricsListResponse)
async def query_analytics_metricss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query analytics_metricss with filtering, sorting, and pagination"""
    logger.debug(f"Querying analytics_metricss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Analytics_metricsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} analytics_metricss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying analytics_metricss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Analytics_metricsListResponse)
async def query_analytics_metricss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query analytics_metricss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying analytics_metricss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Analytics_metricsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} analytics_metricss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying analytics_metricss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Analytics_metricsResponse)
async def get_analytics_metrics(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single analytics_metrics by ID"""
    logger.debug(f"Fetching analytics_metrics with id: {id}, fields={fields}")
    
    service = Analytics_metricsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Analytics_metrics with id {id} not found")
            raise HTTPException(status_code=404, detail="Analytics_metrics not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analytics_metrics {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Analytics_metricsResponse, status_code=201)
async def create_analytics_metrics(
    data: Analytics_metricsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new analytics_metrics"""
    logger.debug(f"Creating new analytics_metrics with data: {data}")
    
    service = Analytics_metricsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create analytics_metrics")
        
        logger.info(f"Analytics_metrics created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating analytics_metrics: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating analytics_metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Analytics_metricsResponse], status_code=201)
async def create_analytics_metricss_batch(
    request: Analytics_metricsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple analytics_metricss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} analytics_metricss")
    
    service = Analytics_metricsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} analytics_metricss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Analytics_metricsResponse])
async def update_analytics_metricss_batch(
    request: Analytics_metricsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple analytics_metricss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} analytics_metricss")
    
    service = Analytics_metricsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} analytics_metricss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Analytics_metricsResponse)
async def update_analytics_metrics(
    id: int,
    data: Analytics_metricsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing analytics_metrics"""
    logger.debug(f"Updating analytics_metrics {id} with data: {data}")

    service = Analytics_metricsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Analytics_metrics with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Analytics_metrics not found")
        
        logger.info(f"Analytics_metrics {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating analytics_metrics {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating analytics_metrics {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_analytics_metricss_batch(
    request: Analytics_metricsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple analytics_metricss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} analytics_metricss")
    
    service = Analytics_metricsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} analytics_metricss successfully")
        return {"message": f"Successfully deleted {deleted_count} analytics_metricss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_analytics_metrics(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single analytics_metrics by ID"""
    logger.debug(f"Deleting analytics_metrics with id: {id}")
    
    service = Analytics_metricsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Analytics_metrics with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Analytics_metrics not found")
        
        logger.info(f"Analytics_metrics {id} deleted successfully")
        return {"message": "Analytics_metrics deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analytics_metrics {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")