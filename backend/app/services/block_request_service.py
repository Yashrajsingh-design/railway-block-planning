from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.department import Department
from app.models.maintenance_task import MaintenanceTask
from app.models.section import Section
from app.schemas.requests import BlockRequestCreate


class BlockRequestService:

    def create_request(
        self,
        db: Session,
        data: BlockRequestCreate,
    ) -> BlockRequest:

        # 1. Check that department exists
        department = db.execute(
            select(Department).where(
                Department.department_id == data.department_id
            )
        ).scalar_one_or_none()

        if department is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department does not exist",
            )

        # 2. Check that section exists
        section = db.execute(
            select(Section).where(
                Section.section_id == data.section_id
            )
        ).scalar_one_or_none()

        if section is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Section does not exist",
            )

        # 3. Check that maintenance task exists
        task = db.execute(
            select(MaintenanceTask).where(
                MaintenanceTask.task_id == data.task_id
            )
        ).scalar_one_or_none()

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maintenance task does not exist",
            )

        # 4. Check task belongs to the requested department
        if task.department_id != data.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maintenance task does not belong to this department",
            )

        # 5. Check task belongs to the requested section
        if task.section_id != data.section_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maintenance task does not belong to this section",
            )

        # 6. Generate a new Block Request ID
        last_request = db.execute(
            select(BlockRequest)
            .order_by(BlockRequest.block_request_id.desc())
        ).scalars().first()

        if last_request is None:
            next_number = 1
        else:
            last_number = int(
                last_request.block_request_id.replace("BR", "")
            )
            next_number = last_number + 1

        block_request_id = f"BR{next_number:05d}"

        # 7. Create the new block request
        request = BlockRequest(
            block_request_id=block_request_id,
            department_id=data.department_id,
            task_id=data.task_id,
            section_id=data.section_id,
            requested_date=data.requested_date,
            preferred_start=data.preferred_start,
            preferred_end=data.preferred_end,
            minimum_duration_min=data.minimum_duration_min,
            block_type=data.block_type,
            request_status="DRAFT",
            priority_score=task.priority_score,
            authorization_status="REQUESTED",
            work_description=data.work_description,
            power_block_required=data.power_block_required,
            bundling_candidate=data.bundling_candidate,
        )

        # 8. Save to PostgreSQL
        db.add(request)
        db.commit()
        db.refresh(request)

        return request