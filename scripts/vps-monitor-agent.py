#!/usr/bin/env python3
"""
VPS Monitor Agent - Script à installer sur le VPS OVH
Ce script collecte les métriques système et les envoie à l'API de surveillance.

Installation sur le VPS:
1. Copier ce fichier sur le VPS: scp vps-monitor-agent.py root@51.210.242.96:/opt/vps-monitor/
2. Installer les dépendances: pip install psutil requests
3. Créer un service systemd (voir ci-dessous)
4. Démarrer le service: systemctl start vps-monitor-agent

Service systemd (/etc/systemd/system/vps-monitor-agent.service):
[Unit]
Description=VPS Monitor Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/vps-monitor/vps-monitor-agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""

import psutil
import requests
import time
import socket
import subprocess
import json
from datetime import datetime

# Configuration - À modifier selon votre installation
API_URL = "https://votre-api.com/api"  # URL de l'API Matrix VPS Monitor
API_TOKEN = "votre-token-jwt"  # Token d'authentification
COLLECT_INTERVAL = 5  # Secondes entre chaque collecte


def get_cpu_metrics():
    """Récupère les métriques CPU"""
    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "cpu_cores": psutil.cpu_count(),
        "load_average": list(psutil.getloadavg())
    }


def get_memory_metrics():
    """Récupère les métriques mémoire"""
    mem = psutil.virtual_memory()
    return {
        "ram_used_gb": round(mem.used / (1024**3), 2),
        "ram_total_gb": round(mem.total / (1024**3), 2),
        "ram_percent": mem.percent
    }


def get_disk_metrics():
    """Récupère les métriques disque"""
    disk = psutil.disk_usage('/')
    return {
        "disk_used_gb": round(disk.used / (1024**3), 1),
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "disk_percent": round(disk.percent, 1)
    }


def get_network_metrics():
    """Récupère les métriques réseau"""
    net_io = psutil.net_io_counters()
    return {
        "network_in_bytes": net_io.bytes_recv,
        "network_out_bytes": net_io.bytes_sent
    }


def get_processes():
    """Récupère la liste des processus"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'username']):
        try:
            pinfo = proc.info
            processes.append({
                "pid": pinfo['pid'],
                "name": pinfo['name'],
                "cpu_percent": round(pinfo['cpu_percent'] or 0, 1),
                "memory_percent": round(pinfo['memory_percent'] or 0, 1),
                "status": pinfo['status'],
                "user": pinfo['username'] or 'unknown'
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    # Trier par CPU et retourner les 20 premiers
    return sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:20]


def get_services():
    """Récupère l'état des services systemd"""
    services = []
    try:
        result = subprocess.run(
            ['systemctl', 'list-units', '--type=service', '--state=running,failed', '--plain', '--no-legend'],
            capture_output=True, text=True
        )
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 4:
                    name = parts[0]
                    active = parts[2] == 'running'
                    desc = ' '.join(parts[4:]) if len(parts) > 4 else name
                    services.append({
                        "name": name,
                        "status": f"{'active (running)' if active else 'inactive'}",
                        "active": active,
                        "description": desc
                    })
    except Exception as e:
        print(f"Erreur lors de la récupération des services: {e}")
    
    return services


def get_installed_apps():
    """Récupère la liste des applications installées (dpkg)"""
    apps = []
    try:
        result = subprocess.run(
            ['dpkg-query', '-W', '-f=${Package}\t${Version}\t${Installed-Size}\n'],
            capture_output=True, text=True
        )
        for line in result.stdout.strip().split('\n')[:50]:  # Limiter à 50 apps
            parts = line.split('\t')
            if len(parts) >= 3:
                size_kb = int(parts[2]) if parts[2].isdigit() else 0
                apps.append({
                    "name": parts[0],
                    "version": parts[1],
                    "size": f"{size_kb / 1024:.1f} MB" if size_kb > 1024 else f"{size_kb} KB"
                })
    except Exception as e:
        print(f"Erreur lors de la récupération des applications: {e}")
    
    return apps


def get_system_info():
    """Récupère les informations système"""
    return {
        "hostname": socket.gethostname(),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
        "processes_count": len(psutil.pids())
    }


def collect_all_metrics():
    """Collecte toutes les métriques"""
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        **get_cpu_metrics(),
        **get_memory_metrics(),
        **get_disk_metrics(),
        **get_network_metrics(),
        **get_system_info()
    }
    return metrics


def send_metrics(metrics):
    """Envoie les métriques à l'API"""
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(f"{API_URL}/metrics/push", json=metrics, headers=headers)
        if response.status_code == 200:
            print(f"[{datetime.now()}] Métriques envoyées avec succès")
        else:
            print(f"[{datetime.now()}] Erreur API: {response.status_code}")
    except Exception as e:
        print(f"[{datetime.now()}] Erreur d'envoi: {e}")


def main():
    """Boucle principale de l'agent"""
    print("=== VPS Monitor Agent ===")
    print(f"API URL: {API_URL}")
    print(f"Intervalle de collecte: {COLLECT_INTERVAL}s")
    print("========================")
    
    while True:
        try:
            metrics = collect_all_metrics()
            print(json.dumps(metrics, indent=2))
            # send_metrics(metrics)  # Décommenter pour envoyer à l'API
        except Exception as e:
            print(f"Erreur de collecte: {e}")
        
        time.sleep(COLLECT_INTERVAL)


if __name__ == "__main__":
    main()
