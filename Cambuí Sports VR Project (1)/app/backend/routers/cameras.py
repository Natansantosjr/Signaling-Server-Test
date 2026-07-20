import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.cameras import CamerasService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/cameras", tags=["cameras"])


# ---------- Pydantic Schemas ----------
class CamerasData(BaseModel):
    """Entity data schema (for create/update)"""
    event_id: int
    name: str
    position: str
    stream_url: str
    quality: str
    status: str
    is_primary: bool = None


class CamerasUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    event_id: Optional[int] = None
    name: Optional[str] = None
    position: Optional[str] = None
    stream_url: Optional[str] = None
    quality: Optional[str] = None
    status: Optional[str] = None
    is_primary: Optional[bool] = None


class CamerasResponse(BaseModel):
    """Entity response schema"""
    id: int
    event_id: int
    name: str
    position: str
    stream_url: str
    quality: str
    status: str
    is_primary: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CamerasListResponse(BaseModel):
    """List response schema"""
    items: List[CamerasResponse]
    total: int
    skip: int
    limit: int


class CamerasBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[CamerasData]


class CamerasBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: CamerasUpdateData


class CamerasBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[CamerasBatchUpdateItem]


class CamerasBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=CamerasListResponse)
async def query_camerass(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query camerass with filtering, sorting, and pagination"""
    logger.debug(f"Querying camerass: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = CamerasService(db)
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
        logger.debug(f"Found {result['total']} camerass")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying camerass: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=CamerasListResponse)
async def query_camerass_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query camerass with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying camerass: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = CamerasService(db)
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
        logger.debug(f"Found {result['total']} camerass")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying camerass: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=CamerasResponse)
async def get_cameras(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single cameras by ID"""
    logger.debug(f"Fetching cameras with id: {id}, fields={fields}")
    
    service = CamerasService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Cameras with id {id} not found")
            raise HTTPException(status_code=404, detail="Cameras not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cameras {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=CamerasResponse, status_code=201)
async def create_cameras(
    data: CamerasData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new cameras"""
    logger.debug(f"Creating new cameras with data: {data}")
    
    service = CamerasService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create cameras")
        
        logger.info(f"Cameras created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating cameras: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating cameras: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[CamerasResponse], status_code=201)
async def create_camerass_batch(
    request: CamerasBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple camerass in a single request"""
    logger.debug(f"Batch creating {len(request.items)} camerass")
    
    service = CamerasService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} camerass successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[CamerasResponse])
async def update_camerass_batch(
    request: CamerasBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple camerass in a single request"""
    logger.debug(f"Batch updating {len(request.items)} camerass")
    
    service = CamerasService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} camerass successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=CamerasResponse)
async def update_cameras(
    id: int,
    data: CamerasUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing cameras"""
    logger.debug(f"Updating cameras {id} with data: {data}")

    service = CamerasService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Cameras with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Cameras not found")
        
        logger.info(f"Cameras {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating cameras {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating cameras {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_camerass_batch(
    request: CamerasBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple camerass by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} camerass")
    
    service = CamerasService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} camerass successfully")
        return {"message": f"Successfully deleted {deleted_count} camerass", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_cameras(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single cameras by ID"""
    logger.debug(f"Deleting cameras with id: {id}")
    
    service = CamerasService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Cameras with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Cameras not found")
        
        logger.info(f"Cameras {id} deleted successfully")
        return {"message": "Cameras deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting cameras {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")