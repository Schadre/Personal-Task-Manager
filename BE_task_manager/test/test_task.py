def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


def test_create_task(client):
    new_task = {'title': 'Buy groceries'}
    response = client.post('/api/tasks', json=new_task)
    assert response.status_code == 200  
    assert 'task_id' in response.json

    get_resp = client.get('/api/tasks')
    tasks = get_resp.json
    assert any(t['title'] == 'Buy groceries' for t in tasks)


def test_get_tasks(client, init_database):

    response = client.get('/api/tasks')
    assert response.status_code == 200
    assert len(response.json) == 2
    titles = [t['title'] for t in response.json]
    assert 'Write tests' in titles
    assert 'Review PR' in titles


def test_update_task(client, init_database):

    get_resp = client.get('/api/tasks')
    task_id = get_resp.json[0]['id']

    update_data = {'status': 'completed', 'priority': 'low'}
    put_resp = client.put(f'/api/tasks/{task_id}', json=update_data)
    assert put_resp.status_code == 200

    get_again = client.get('/api/tasks')
    updated_task = next(t for t in get_again.json if t['id'] == task_id)
    assert updated_task['status'] == 'completed'
    assert updated_task['priority'] == 'low'


def test_delete_task(client, init_database):
    get_resp = client.get('/api/tasks')
    task_id = get_resp.json[0]['id']

    del_resp = client.delete(f'/api/tasks/{task_id}')
    assert del_resp.status_code == 200

    after_del = client.get('/api/tasks')
    assert len(after_del.json) == 1
    assert all(t['id'] != task_id for t in after_del.json)


def test_dashboard_endpoint(client, init_database):
    response = client.get('/api/dashboard')
    assert response.status_code == 200
    data = response.json
    assert 'pending' in data
    assert 'completed' in data
    assert 'overdue' in data
    assert 'Write tests' in data['pending']
    assert 'Review PR' in data['completed']
