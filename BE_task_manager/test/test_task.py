def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


def test_create_task(client):
    new_task = {'title': 'Buy groceries'}
    response = client.post('/api/tasks', json=new_task)
    assert response.status_code == 201
    data = response.json
    assert 'id' in data
    assert data['title'] == 'Buy groceries'
    assert 'created_at' in data
    assert 'updated_at' in data


def test_get_tasks(client, init_database):
    response = client.get('/api/tasks')
    assert response.status_code == 200
    tasks = response.json
    assert len(tasks) == 2
    assert tasks[0]['title'] == 'Write tests'
    assert tasks[1]['title'] == 'Review PR'


def test_update_task(client, init_database):
    get_resp = client.get('/api/tasks')
    tasks = get_resp.json
    task_id = tasks[0]['id']
    before = tasks[0]

    import time
    time.sleep(0.01) 

    update_data = {'title': 'Updated Title', 'status': 'completed'}
    put_resp = client.put(f'/api/tasks/{task_id}', json=update_data)
    assert put_resp.status_code == 200
    after = put_resp.json 

    assert after['created_at'] == before['created_at']
    assert after['updated_at'] > before['updated_at']

    get_again = client.get('/api/tasks')
    updated = next(t for t in get_again.json if t['id'] == task_id)
    assert updated['title'] == 'Updated Title'
    assert updated['status'] == 'completed'


def test_delete_task(client, init_database):
    get_resp = client.get('/api/tasks')
    tasks = get_resp.json
    task_id = tasks[0]['id']
    del_resp = client.delete(f'/api/tasks/{task_id}')
    assert del_resp.status_code == 200
    get_after = client.get('/api/tasks')
    assert len(get_after.json) == 1
    assert get_after.json[0]['id'] != task_id


def test_dashboard_endpoint(client, init_database):
    response = client.get('/api/dashboard')
    assert response.status_code == 200
    data = response.json
    assert 'pending' in data
    assert 'completed' in data
    assert 'overdue' in data
    assert len(data['pending']) + len(data['completed']) == 2
