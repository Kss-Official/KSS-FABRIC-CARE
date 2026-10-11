import os
import sys
import time
import subprocess

os.environ.setdefault('PYTHONUNBUFFERED', '1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

print(f"Starting resilient Django server in {backend_dir}...")

while True:
    try:
        proc = subprocess.run([
            sys.executable,
            "-u",
            "manage.py",
            "runserver",
            "127.0.0.1:8001",
            "--noreload"
        ])
    except Exception as e:
        print(f"Django server process exited with error: {e}")
    time.sleep(1)
