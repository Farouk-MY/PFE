import os
import json
import logging
import uuid
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

import pandas as pd
from pypdf import PdfReader

from app.config import PDF_DIR, CSV_DIR, JSON_DIR
from app.models.schemas import DocumentType

logger = logging.getLogger(__name__)


class DocumentParser:
    """Parser for different document types"""

    @staticmethod
    def parse_pdf(file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Parse PDF content

        Args:
            file_content: Raw PDF content
            filename: Original filename

        Returns:
            Tuple of (extracted_text, saved_file_path)
        """
        try:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(PDF_DIR, unique_filename)

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Extract text
            reader = PdfReader(file_path)
            text = ""

            for page in reader.pages:
                text += page.extract_text() + "\n"

            return text, file_path
        except Exception as e:
            logger.error(f"Error parsing PDF: {str(e)}")
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    @staticmethod
    def parse_csv(file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Parse CSV content

        Args:
            file_content: Raw CSV content
            filename: Original filename

        Returns:
            Tuple of (extracted_text, saved_file_path)
        """
        try:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(CSV_DIR, unique_filename)

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Read CSV
            df = pd.read_csv(file_path)

            # Convert DataFrame to text representation
            # Include column names
            text = f"CSV File: {filename}\n\n"
            text += f"Columns: {', '.join(df.columns)}\n\n"

            # Include sample rows
            text += "Sample Data:\n"
            sample_rows = df.head(10).fillna("N/A")

            for idx, row in sample_rows.iterrows():
                text += f"Row {idx + 1}:\n"
                for col in df.columns:
                    text += f"  {col}: {row[col]}\n"
                text += "\n"

            # Include summary statistics for numeric columns
            text += "Summary Statistics:\n"
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                for col in numeric_cols:
                    text += f"  {col} - Min: {df[col].min()}, Max: {df[col].max()}, "
                    text += f"Mean: {df[col].mean()}, Median: {df[col].median()}\n"

            # Include unique value counts for categorical columns (limited)
            categorical_cols = df.select_dtypes(include=['object']).columns
            if len(categorical_cols) > 0:
                text += "\nCategory Distributions:\n"
                for col in categorical_cols:
                    if df[col].nunique() < 10:  # Only for columns with few unique values
                        text += f"  {col} - Values: {', '.join(df[col].value_counts().index[:5])}\n"

            return text, file_path
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise ValueError(f"Failed to parse CSV: {str(e)}")

    @staticmethod
    def parse_json(file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Parse JSON content

        Args:
            file_content: Raw JSON content
            filename: Original filename

        Returns:
            Tuple of (extracted_text, saved_file_path)
        """
        try:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(JSON_DIR, unique_filename)

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Parse JSON
            json_data = json.loads(file_content.decode('utf-8'))

            # Format as readable text
            text = f"JSON File: {filename}\n\n"

            # Format nicely with indentation
            formatted_json = json.dumps(json_data, indent=2)
            text += formatted_json

            return text, file_path
        except Exception as e:
            logger.error(f"Error parsing JSON: {str(e)}")
            raise ValueError(f"Failed to parse JSON: {str(e)}")

    @staticmethod
    def parse_text(file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Parse plain text content

        Args:
            file_content: Raw text content
            filename: Original filename

        Returns:
            Tuple of (extracted_text, saved_file_path)
        """
        try:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(PDF_DIR, unique_filename)  # Store in PDF directory for simplicity

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Extract text
            text = file_content.decode('utf-8')

            return text, file_path
        except Exception as e:
            logger.error(f"Error parsing text: {str(e)}")
            raise ValueError(f"Failed to parse text file: {str(e)}")

    @classmethod
    def parse_document(cls, file_content: bytes, filename: str, doc_type: DocumentType) -> Tuple[str, str]:
        """
        Parse document based on type

        Args:
            file_content: Raw file content
            filename: Original filename
            doc_type: Type of document

        Returns:
            Tuple of (extracted_text, saved_file_path)
        """
        if doc_type == DocumentType.PDF:
            return cls.parse_pdf(file_content, filename)
        elif doc_type == DocumentType.CSV:
            return cls.parse_csv(file_content, filename)
        elif doc_type == DocumentType.JSON:
            return cls.parse_json(file_content, filename)
        elif doc_type == DocumentType.TEXT:
            return cls.parse_text(file_content, filename)
        else:
            raise ValueError(f"Unsupported document type: {doc_type}")

    @staticmethod
    def extract_metadata(file_path: str) -> Dict[str, Any]:
        """Extract metadata from a file"""
        stat_info = os.stat(file_path)
        filename = os.path.basename(file_path)

        return {
            "filename": filename,
            "size_bytes": stat_info.st_size,
            "created": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
            "source": filename,
        }