"""
File Storage Manager for SilkRoute OS Declaration Helper
Handles secure file uploads and storage for document processing
"""

import os
import uuid
import shutil
from typing import Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException

class FileStorageManager:
    """
    Manages file storage operations for uploaded documents
    """
    
    def __init__(self, base_upload_dir: str = "storage/uploads"):
        self.base_upload_dir = Path(base_upload_dir)
        self.base_upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Allowed file extensions for security
        self.allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'}
        
        # Maximum file size (10MB)
        self.max_file_size = 10 * 1024 * 1024
    
    def save_uploaded_file(self, file: UploadFile, shipment_id: int, document_type: str) -> str:
        """
        Save uploaded file to storage and return the file path
        
        Args:
            file: The uploaded file
            shipment_id: ID of the associated shipment
            document_type: Type of document being uploaded
            
        Returns:
            String path to the saved file
        """
        # Validate file
        self._validate_file(file)
        
        # Create directory structure: storage/uploads/shipment_123/
        shipment_dir = self.base_upload_dir / f"shipment_{shipment_id}"
        shipment_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = self._get_file_extension(file.filename)
        unique_filename = f"{document_type}_{uuid.uuid4().hex}{file_extension}"
        file_path = shipment_dir / unique_filename
        
        try:
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            return str(file_path)
            
        except Exception as e:
            # Clean up partial file if save failed
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            path = Path(file_path)
            if path.exists() and path.is_file():
                path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get information about a stored file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dictionary with file information or None if file doesn't exist
        """
        try:
            path = Path(file_path)
            if not path.exists():
                return None
                
            stat = path.stat()
            return {
                "filename": path.name,
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "extension": path.suffix.lower()
            }
        except Exception:
            return None
    
    def _validate_file(self, file: UploadFile):
        """
        Validate uploaded file for security and size constraints
        """
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Check file extension
        file_extension = self._get_file_extension(file.filename)
        if file_extension not in self.allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Supported types: {', '.join(self.allowed_extensions)}"
            )
        
        # Check file size (reset file pointer first)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > self.max_file_size:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size: {self.max_file_size // (1024*1024)}MB"
            )
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file not allowed")
    
    def _get_file_extension(self, filename: str) -> str:
        """
        Extract and validate file extension
        """
        if not filename:
            return ""
        
        extension = Path(filename).suffix.lower()
        return extension if extension else ""

# Global instance
file_storage = FileStorageManager()