from typing import Dict, Any, List
from models import Priority, Status


class ValidationService:
    """Validates task create/update payloads. Returns list of {field, message}."""

    @staticmethod
    def validate_create(data: Dict[str, Any]) -> List[Dict[str, str]]:
        errors = []


        if not data.get('title'):
            errors.append({'field': 'title', 'message': 'Title is required.'})
        elif len(data['title']) > 140:
            errors.append(
                {'field': 'title', 'message': 'Title must be at most 140 characters.'})


        if data.get('description') and len(data['description']) > 2000:
            errors.append(
                {'field': 'description', 'message': 'Description must be at most 2000 characters.'})


        if 'due_date' in data and data['due_date'] is not None:
            if not ValidationService._is_valid_iso_date(data['due_date']):
                errors.append(
                    {'field': 'due_date', 'message': 'Due date must be ISO-8601 format.'})


        if 'priority' in data and data['priority'] is not None:
            if not ValidationService._is_valid_priority(data['priority']):
                errors.append(
                    {'field': 'priority', 'message': f"Invalid priority: {data['priority']}."})

        if 'status' in data and data['status'] is not None:
            if not ValidationService._is_valid_status(data['status']):
                errors.append(
                    {'field': 'status', 'message': f"Invalid status: {data['status']}."})

        return errors

    @staticmethod
    def validate_update(data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Validates partial update data – only checks fields that are present."""
        errors = []

        if 'title' in data:
            if not data['title']:
                errors.append(
                    {'field': 'title', 'message': 'Title cannot be empty.'})
            elif len(data['title']) > 140:
                errors.append(
                    {'field': 'title', 'message': 'Title must be at most 140 characters.'})

        if 'description' in data and data['description'] is not None:
            if len(data['description']) > 2000:
                errors.append(
                    {'field': 'description', 'message': 'Description must be at most 2000 characters.'})

        if 'due_date' in data:
            if data['due_date'] is not None and not ValidationService._is_valid_iso_date(data['due_date']):
                errors.append(
                    {'field': 'due_date', 'message': 'Due date must be ISO-8601 format.'})

        if 'priority' in data and data['priority'] is not None:
            if not ValidationService._is_valid_priority(data['priority']):
                errors.append(
                    {'field': 'priority', 'message': f"Invalid priority: {data['priority']}."})

        if 'status' in data and data['status'] is not None:
            if not ValidationService._is_valid_status(data['status']):
                errors.append(
                    {'field': 'status', 'message': f"Invalid status: {data['status']}."})

        return errors


    @staticmethod
    def _is_valid_iso_date(value: str) -> bool:
        """Checks if a string looks like a valid ISO date/datetime."""
        try:
            from dateutil import parser
            parser.isoparse(value)
            return True
        except Exception:
            return False

    @staticmethod
    def _is_valid_priority(value: str) -> bool:
        try:
            Priority.from_string(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_valid_status(value: str) -> bool:
        try:
            Status.from_string(value)
            return True
        except ValueError:
            return False
