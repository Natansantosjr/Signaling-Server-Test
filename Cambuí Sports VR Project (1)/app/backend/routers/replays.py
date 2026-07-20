import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.replays import ReplaysService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/replays", tags=["replays"])


# ---------- Pydantic Schemas ----------
class ReplaysData(BaseModel):
    """Entity data schema (for create/update)"""
    event_id: int
    camera_id: int
    title: str
    start_timestamp: datetime
    end_timestamp: datetime
    duration_seconds: int
    replay_url: str = None
    type: str = None


class ReplaysUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    event_id: Optional[int] = None
    camera_id: Optional[int] = None
    title: Optional[str] = None
    start_timestamp: Optional[datetime] = None
    end_timestamp: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    replay_url: Optional[str] = None
    type: Optional[str] = None


class ReplaysResponse(BaseModel):
    """Entity response schema"""
    id: int
    event_id: int
    camera_id: int
    title: str
    start_timestamp: datetime
    end_timestamp: datetime
    duration_seconds: int
    replay_url: Optional[str] = None
    type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReplaysListResponse(BaseModel):
    """List response schema"""
    items: List[ReplaysResponse]
    total: int
    skip: int
    limit: int


class ReplaysBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ReplaysData]


class ReplaysBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ReplaysUpdateData


class ReplaysBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ReplaysBatchUpdateItem]


class ReplaysBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ReplaysListResponse)
async def query_replayss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query replayss with filtering, sorting, and pagination"""
    logger.debug(f"Querying replayss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ReplaysService(db)
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
        logger.debug(f"Found {result['total']} replayss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying replayss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ReplaysListResponse)
async def query_replayss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query replayss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying replayss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ReplaysService(db)
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
        logger.debug(f"Found {result['total']} replayss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying replayss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ReplaysResponse)
async def get_replays(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single replays by ID"""
    logger.debug(f"Fetching replays with id: {id}, fields={fields}")
    
    service = ReplaysService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Replays with id {id} not found")
            raise HTTPException(status_code=404, detail="Replays not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching replays {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ReplaysResponse, status_code=201)
async def create_replays(
    data: ReplaysData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new replays"""
    logger.debug(f"Creating new replays with data: {data}")
    
    service = ReplaysService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create replays")
        
        logger.info(f"Replays created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating replays: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating replays: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ReplaysResponse], status_code=201)
async def create_replayss_batch(
    request: ReplaysBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple replayss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} replayss")
    
    service = ReplaysService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} replayss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ReplaysResponse])
async def update_replayss_batch(
    request: ReplaysBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple replayss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} replayss")
    
    service = ReplaysService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} replayss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ReplaysResponse)
async def update_replays(
    id: int,
    data: ReplaysUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing replays"""
    logger.debug(f"Updating replays {id} with data: {data}")

    service = ReplaysService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Replays with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Replays not found")
        
        logger.info(f"Replays {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating replays {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating replays {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_replayss_batch(
    request: ReplaysBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple replayss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} replayss")
    
    service = ReplaysService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} replayss successfully")
        return {"message": f"Successfully deleted {deleted_count} replayss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_replays(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single replays by ID"""
    logger.debug(f"Deleting replays with id: {id}")
    
    service = ReplaysService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Replays with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Replays not found")
        
        logger.info(f"Replays {id} deleted successfully")
        return {"message": "Replays deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting replays {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")