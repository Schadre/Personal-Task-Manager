import pytest


def test_unauthenticated_request_rejected(client):
    resp = client.get('/api/tasks')
    assert resp.status_code == 401
    assert resp.json['error'] == 'Unauthorized'


def test_login_flow_success(client, monkeypatch):
    def mock_verify_oauth2_token(token, req, client_id):
        return {
            'sub': '123456',
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/avatar.jpg'
        }
    monkeypatch.setattr(
        'google.oauth2.id_token.verify_oauth2_token', mock_verify_oauth2_token)
    resp = client.post('/auth/google/token', json={'token': 'fake_token'})
    assert resp.status_code == 200
    assert 'user' in resp.json
    assert resp.json['user']['email'] == 'test@example.com'


def test_login_flow_missing_token(client):
    resp = client.post('/auth/google/token', json={})
    assert resp.status_code == 400
    assert 'error' in resp.json


def test_login_flow_invalid_token(client, monkeypatch):
    def mock_verify_failure(*args, **kwargs):
        raise ValueError("Invalid token")
    monkeypatch.setattr(
        'google.oauth2.id_token.verify_oauth2_token', mock_verify_failure)
    resp = client.post('/auth/google/token', json={'token': 'bad'})
    assert resp.status_code == 401
    assert 'error' in resp.json


def test_logout_clears_session(auth_client):
    resp = auth_client.post('/auth/logout')
    assert resp.status_code == 200
    resp2 = auth_client.get('/api/tasks')
    assert resp2.status_code == 401


def test_get_current_user_authenticated(auth_client):
    resp = auth_client.get('/auth/me')
    assert resp.status_code == 200
    assert 'email' in resp.json
    assert resp.json['email'] != ''


def test_get_current_user_unauthenticated(client):
    resp = client.get('/auth/me')
    assert resp.status_code == 401
