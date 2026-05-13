import pytest
from services.validation import ValidationService


class TestValidationCreate:
    def test_empty_title(self):
        errors = ValidationService.validate_create({'title': ''})
        assert len(errors) == 1
        assert errors[0]['field'] == 'title'
        assert 'required' in errors[0]['message'].lower()

    def test_title_too_long(self):
        errors = ValidationService.validate_create({'title': 'A' * 141})
        assert any(e['field'] == 'title' for e in errors)

    def test_valid_title(self):
        errors = ValidationService.validate_create({'title': 'Buy milk'})
        assert not any(e['field'] == 'title' for e in errors)

    def test_description_too_long(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'description': 'X' * 2001})
        assert any(e['field'] == 'description' for e in errors)

    def test_invalid_due_date(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'due_date': 'not-a-date'})
        assert any(e['field'] == 'due_date' for e in errors)

    def test_valid_iso_date(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'due_date': '2026-12-01T10:00:00'})
        assert not any(e['field'] == 'due_date' for e in errors)

    def test_invalid_priority(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'priority': 'urgent'})
        assert any(e['field'] == 'priority' for e in errors)

    def test_valid_priority(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'priority': 'high'})
        assert not any(e['field'] == 'priority' for e in errors)

    def test_invalid_status(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'status': 'started'})
        assert any(e['field'] == 'status' for e in errors)

    def test_valid_status(self):
        errors = ValidationService.validate_create(
            {'title': 'Task', 'status': 'completed'})
        assert not any(e['field'] == 'status' for e in errors)

    def test_all_valid(self):
        errors = ValidationService.validate_create({
            'title': 'Valid Task',
            'description': 'A valid description',
            'due_date': '2026-06-01',
            'priority': 'low',
            'status': 'pending'
        })
        assert errors == []


class TestValidationUpdate:
    def test_empty_title(self):
        errors = ValidationService.validate_update({'title': ''})
        assert any(e['field'] == 'title' for e in errors)

    def test_partial_valid(self):
        errors = ValidationService.validate_update({'priority': 'high'})
        assert errors == []

    def test_invalid_priority(self):
        errors = ValidationService.validate_update(
            {'priority': 'not-a-priority'})
        assert any(e['field'] == 'priority' for e in errors)

    def test_due_date_none_accepted(self):
        errors = ValidationService.validate_update({'due_date': None})
        assert not any(e['field'] == 'due_date' for e in errors)

    def test_description_length(self):
        errors = ValidationService.validate_update({'description': 'X' * 2001})
        assert any(e['field'] == 'description' for e in errors)
