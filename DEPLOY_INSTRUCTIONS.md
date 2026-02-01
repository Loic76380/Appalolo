# Instructions de Déploiement - Matrix VPS Monitor
# Domaine: appalolo.fr

## 📁 Structure sur le VPS

L'application sera installée dans `/opt/vps-monitor/` pour respecter l'arborescence existante:

```
/opt/
├── containerd/
├── cooking-capture/
├── saisiemath/
└── vps-monitor/          # <- Nouvelle application
    ├── backend/
    ├── frontend/
    └── agent/
```

---

## 🚀 Commandes complètes pour déployer sur le VPS

### Copier et coller ces commandes sur le VPS (51.210.242.96):

```bash
# === ÉTAPE 1: Cloner depuis GitHub ===
cd /opt
git clone https://github.com/Loic76380/vps-monitor.git
cd vps-monitor

# === ÉTAPE 2: Configuration Backend ===
cd /opt/vps-monitor/backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn motor pymongo bcrypt pyjwt python-dotenv email-validator

# Créer le fichier .env
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="vps_monitor"
JWT_SECRET="matrix-vps-appalolo-secret-2024"
CORS_ORIGINS="https://appalolo.fr,http://appalolo.fr"
EOF

# === ÉTAPE 3: Configuration Frontend ===
cd /opt/vps-monitor/frontend

# Créer le fichier .env pour la production
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://appalolo.fr
EOF

# Installer et builder
yarn install
yarn build

# === ÉTAPE 4: Configuration Nginx ===
cat > /etc/nginx/sites-available/appalolo << 'EOF'
server {
    listen 80;
    server_name appalolo.fr www.appalolo.fr;

    # Frontend React
    location / {
        root /opt/vps-monitor/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/appalolo /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# === ÉTAPE 5: Service Systemd Backend ===
cat > /etc/systemd/system/vps-monitor.service << 'EOF'
[Unit]
Description=VPS Monitor Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/vps-monitor/backend
Environment="PATH=/opt/vps-monitor/backend/venv/bin"
ExecStart=/opt/vps-monitor/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Démarrer le service
systemctl daemon-reload
systemctl enable vps-monitor
systemctl start vps-monitor

# === ÉTAPE 6: HTTPS avec Certbot ===
certbot --nginx -d appalolo.fr -d www.appalolo.fr

# === VÉRIFICATION ===
systemctl status vps-monitor
curl -s http://localhost:8001/api/ 
echo "✅ Application déployée sur https://appalolo.fr"
```

---

## 📝 Commandes Git (à exécuter sur votre machine de dev)

```bash
cd /app
git init
git remote add origin https://github.com/Loic76380/vps-monitor.git
git add .
git commit -m "Matrix VPS Monitor - appalolo.fr"
git branch -M main
git push -u origin main
```

---

## 📝 Mise à jour de l'application

```bash
cd /opt/vps-monitor
git pull origin main
cd frontend && yarn install && yarn build
systemctl restart vps-monitor
```

---

## 🐛 Dépannage

```bash
# Logs backend
journalctl -u vps-monitor -f

# Logs Nginx
tail -f /var/log/nginx/error.log

# Status des services
systemctl status vps-monitor nginx mongodb
```

---

## ✅ Vérification

1. Accédez à `https://appalolo.fr`
2. Connectez-vous avec:
   - Email: `loicchampanay@gmail.com`
   - Mot de passe: `Pixel76380*`
3. Le dashboard Matrix devrait s'afficher avec les métriques
