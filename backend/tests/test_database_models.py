from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import engine
from app.models.asset import Asset
from app.models.block_request import BlockRequest
from app.models.maintenance_task import MaintenanceTask


def test_can_read_assets_from_database():
    with Session(engine) as session:
        asset = session.execute(
            select(Asset)
        ).scalars().first()

    assert asset is not None
    assert asset.asset_id is not None


def test_can_read_maintenance_tasks_from_database():
    with Session(engine) as session:
        task = session.execute(
            select(MaintenanceTask)
        ).scalars().first()

    assert task is not None
    assert task.task_id is not None


def test_can_read_block_requests_from_database():
    with Session(engine) as session:
        request = session.execute(
            select(BlockRequest)
        ).scalars().first()

    assert request is not None
    assert request.block_request_id is not None