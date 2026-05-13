import os


def post_fork(server, worker):
    if worker.age == 0:  
        os.environ['APSCHEDULER_RUN'] = '1'
