from celery import Celery
import os

# Configure Celery app
celery_app = Celery(
    "silkroute_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["workers.ocr_worker"]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "workers.ocr_worker.process_document_ocr": {"queue": "ocr_queue"}
    }
)

if __name__ == "__main__":
    celery_app.start()