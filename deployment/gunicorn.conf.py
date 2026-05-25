# ─────────────────────────────────────────────
# EventSphere - Gunicorn Configuration
# For Flask AI Microservice
# Usage: gunicorn -c gunicorn.conf.py app:app
# ─────────────────────────────────────────────

import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Process naming
proc_name = "eventsphere-ai"

# Logging
accesslog = "/var/log/eventsphere/flask-access.log"
errorlog = "/var/log/eventsphere/flask-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# App settings
reload = False  # Disable in production
daemon = False
