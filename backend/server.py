from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Matrix VPS Monitor API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== VPS DATA SIMULATION ==============

def generate_vps_metrics() -> Dict[str, Any]:
    """Simulates VPS metrics - will be replaced by real agent data"""
    base_cpu = random.uniform(15, 45)
    base_ram = random.uniform(2.5, 5.5)
    
    return {
        "cpu_percent": round(base_cpu + random.uniform(-5, 5), 1),
        "cpu_cores": 4,
        "ram_used_gb": round(base_ram + random.uniform(-0.3, 0.3), 2),
        "ram_total_gb": 8.0,
        "ram_percent": round((base_ram / 8.0) * 100, 1),
        "disk_used_gb": round(random.uniform(45, 55), 1),
        "disk_total_gb": 80.0,
        "disk_percent": round(random.uniform(56, 69), 1),
        "network_in_mbps": round(random.uniform(0.5, 25), 2),
        "network_out_mbps": round(random.uniform(0.2, 15), 2),
        "uptime_seconds": random.randint(86400, 864000),
        "load_average": [round(random.uniform(0.1, 2), 2) for _ in range(3)],
        "processes_count": random.randint(80, 150),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def generate_processes() -> List[Dict[str, Any]]:
    """Simulates process list"""
    processes = [
        {"name": "nginx", "user": "www-data", "base_cpu": 0.5, "base_mem": 1.2},
        {"name": "python3", "user": "root", "base_cpu": 2.5, "base_mem": 3.5},
        {"name": "node", "user": "node", "base_cpu": 1.8, "base_mem": 4.2},
        {"name": "mongod", "user": "mongodb", "base_cpu": 3.2, "base_mem": 8.5},
        {"name": "redis-server", "user": "redis", "base_cpu": 0.3, "base_mem": 0.8},
        {"name": "sshd", "user": "root", "base_cpu": 0.1, "base_mem": 0.2},
        {"name": "systemd", "user": "root", "base_cpu": 0.2, "base_mem": 0.5},
        {"name": "cron", "user": "root", "base_cpu": 0.0, "base_mem": 0.1},
        {"name": "containerd", "user": "root", "base_cpu": 1.5, "base_mem": 2.8},
        {"name": "uvicorn", "user": "root", "base_cpu": 0.8, "base_mem": 1.5},
    ]
    
    result = []
    for i, proc in enumerate(processes):
        result.append({
            "pid": 1000 + i * random.randint(10, 100),
            "name": proc["name"],
            "cpu_percent": round(proc["base_cpu"] + random.uniform(-0.2, 0.5), 1),
            "memory_percent": round(proc["base_mem"] + random.uniform(-0.3, 0.8), 1),
            "status": random.choice(["running", "sleeping"]),
            "user": proc["user"]
        })
    return sorted(result, key=lambda x: x["cpu_percent"], reverse=True)

def generate_services() -> List[Dict[str, Any]]:
    """Simulates systemd services"""
    services = [
        {"name": "nginx.service", "desc": "A high performance web server"},
        {"name": "mongod.service", "desc": "MongoDB Database Server"},
        {"name": "docker.service", "desc": "Docker Application Container Engine"},
        {"name": "ssh.service", "desc": "OpenBSD Secure Shell server"},
        {"name": "cron.service", "desc": "Regular background program processing"},
        {"name": "ufw.service", "desc": "Uncomplicated firewall"},
        {"name": "fail2ban.service", "desc": "Fail2Ban Service"},
        {"name": "containerd.service", "desc": "containerd container runtime"},
        {"name": "vps-monitor.service", "desc": "VPS Monitor Backend"},
    ]
    
    result = []
    for svc in services:
        is_active = random.random() > 0.1
        result.append({
            "name": svc["name"],
            "status": "active (running)" if is_active else "inactive (dead)",
            "active": is_active,
            "description": svc["desc"]
        })
    return result

def generate_installed_apps() -> List[Dict[str, Any]]:
    """Simulates installed applications"""
    apps = [
        {"name": "nginx", "version": "1.24.0-1", "size": "1.2 MB"},
        {"name": "nodejs", "version": "20.11.0", "size": "45.3 MB"},
        {"name": "python3", "version": "3.10.12", "size": "23.8 MB"},
        {"name": "mongodb-org", "version": "7.0.5", "size": "178.2 MB"},
        {"name": "docker-ce", "version": "25.0.3", "size": "89.5 MB"},
        {"name": "certbot", "version": "2.8.0", "size": "8.7 MB"},
        {"name": "git", "version": "2.43.0", "size": "12.4 MB"},
        {"name": "vim", "version": "9.0.2116", "size": "3.2 MB"},
        {"name": "htop", "version": "3.3.0", "size": "0.3 MB"},
        {"name": "fail2ban", "version": "1.0.2", "size": "2.8 MB"},
        {"name": "ufw", "version": "0.36.2", "size": "0.5 MB"},
    ]
    return apps

# Default metric preferences
DEFAULT_METRICS = [
    {"id": "cpu", "name": "CPU Usage", "enabled": True},
    {"id": "ram", "name": "RAM Usage", "enabled": True},
    {"id": "disk", "name": "Disk Usage", "enabled": True},
    {"id": "network", "name": "Network I/O", "enabled": True},
    {"id": "processes", "name": "Active Processes", "enabled": True},
    {"id": "services", "name": "System Services", "enabled": True},
    {"id": "apps", "name": "Installed Applications", "enabled": True},
    {"id": "uptime", "name": "Uptime & Load", "enabled": True},
]

# Store preferences in memory (no auth needed)
current_preferences = DEFAULT_METRICS.copy()

# ============== METRICS ROUTES ==============

@api_router.get("/metrics/current")
async def get_current_metrics():
    return generate_vps_metrics()

@api_router.get("/metrics/history")
async def get_metrics_history(hours: int = 1):
    """Returns simulated historical metrics"""
    history = []
    now = datetime.now(timezone.utc)
    points = min(hours * 12, 72)  # 5 min intervals, max 6 hours
    
    for i in range(points):
        timestamp = now - timedelta(minutes=i * 5)
        metrics = generate_vps_metrics()
        metrics["timestamp"] = timestamp.isoformat()
        history.append(metrics)
    
    return list(reversed(history))

@api_router.get("/processes")
async def get_processes():
    return generate_processes()

@api_router.get("/services")
async def get_services():
    return generate_services()

@api_router.get("/apps")
async def get_installed_apps():
    return generate_installed_apps()

# ============== PREFERENCES ROUTES ==============

@api_router.get("/preferences")
async def get_preferences():
    return current_preferences

@api_router.put("/preferences")
async def update_preferences(data: dict):
    global current_preferences
    prefs = data.get("preferences", [])
    
    for update in prefs:
        for pref in current_preferences:
            if pref["id"] == update.get("metric_id"):
                pref["enabled"] = update.get("enabled", True)
                break
    
    return current_preferences

# ============== VPS INFO ==============

@api_router.get("/vps/info")
async def get_vps_info():
    return {
        "hostname": "vps-ovh-51210242096",
        "ip": "51.210.242.96",
        "os": "Ubuntu 22.04.5 LTS",
        "kernel": "5.15.0-164-generic",
        "architecture": "x86_64",
        "provider": "OVH",
        "datacenter": "GRA (Gravelines, France)"
    }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Matrix VPS Monitor API", "status": "online"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
