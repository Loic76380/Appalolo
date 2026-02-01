# Instructions de Déploiement - Matrix VPS Monitor

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

## 🚀 Commandes Git pour pousser sur GitHub

### 1. Initialiser le repository (si pas déjà fait)

```bash
# Sur votre machine locale ou le serveur de développement
cd /app

# Initialiser Git
git init

# Ajouter le remote GitHub
git remote add origin https://github.com/Loic76380/vps-monitor.git

# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "Initial commit - Matrix VPS Monitor"

# Pousser sur GitHub
git branch -M main
git push -u origin main
```

### 2. Pour les mises à jour futures

```bash
git add .
git commit -m "Description des modifications"
git push origin main
```

---

## 📦 Déploiement sur le VPS OVH (51.210.242.96)

### Étape 1: Connexion au VPS

```bash
ssh root@51.210.242.96
```

### Étape 2: Créer le répertoire et cloner

```bash
# Créer le répertoire
mkdir -p /opt/vps-monitor

# Cloner depuis GitHub
cd /opt
git clone https://github.com/Loic76380/vps-monitor.git
cd vps-monitor
```

### Étape 3: Configuration Backend

```bash
# Créer l'environnement virtuel Python
cd /opt/vps-monitor/backend
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="vps_monitor"
JWT_SECRET="votre-secret-jwt-secure-ici"
CORS_ORIGINS="*"
EOF
```

### Étape 4: Configuration Frontend

```bash
cd /opt/vps-monitor/frontend

# Installer les dépendances
yarn install

# Build pour production
yarn build

# Le build sera dans /opt/vps-monitor/frontend/build/
```

### Étape 5: Configuration Nginx

Créer le fichier `/etc/nginx/sites-available/vps-monitor`:

```nginx
server {
    listen 80;
    server_name monitor.votre-domaine.com;  # ou utilisez l'IP

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
```

Activer le site:

```bash
ln -s /etc/nginx/sites-available/vps-monitor /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Étape 6: Service Systemd pour le Backend

Créer `/etc/systemd/system/vps-monitor-backend.service`:

```ini
[Unit]
Description=VPS Monitor Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/vps-monitor/backend
Environment="PATH=/opt/vps-monitor/backend/venv/bin"
ExecStart=/opt/vps-monitor/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Démarrer le service:

```bash
systemctl daemon-reload
systemctl enable vps-monitor-backend
systemctl start vps-monitor-backend
systemctl status vps-monitor-backend
```

---

## 🔧 Configuration de l'Agent de Monitoring (Optionnel)

Si vous voulez des métriques réelles au lieu de données simulées:

### Installer l'agent sur le VPS

```bash
# Copier l'agent
cp /opt/vps-monitor/scripts/vps-monitor-agent.py /opt/vps-monitor/agent/

# Installer psutil
pip3 install psutil requests

# Créer le service
cat > /etc/systemd/system/vps-monitor-agent.service << 'EOF'
[Unit]
Description=VPS Monitor Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/vps-monitor/agent/vps-monitor-agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Démarrer l'agent
systemctl daemon-reload
systemctl enable vps-monitor-agent
systemctl start vps-monitor-agent
```

---

## 🔐 Sécurité

### Pare-feu (UFW)

```bash
# Autoriser le port de l'application (si accès direct)
ufw allow 80/tcp
ufw allow 443/tcp
```

### HTTPS avec Certbot (Recommandé)

```bash
# Installer Certbot
apt install certbot python3-certbot-nginx

# Obtenir un certificat
certbot --nginx -d monitor.votre-domaine.com
```

---

## ✅ Vérification

1. Accédez à `http://51.210.242.96/` (ou votre domaine)
2. Connectez-vous avec:
   - Email: `loicchampanay@gmail.com`
   - Mot de passe: `Pixel76380*`
3. Vérifiez que le dashboard affiche les métriques

---

## 📝 Mise à jour de l'application

```bash
cd /opt/vps-monitor
git pull origin main

# Rebuild frontend si nécessaire
cd frontend && yarn install && yarn build

# Redémarrer le backend
systemctl restart vps-monitor-backend
```

---

## 🐛 Dépannage

### Voir les logs du backend
```bash
journalctl -u vps-monitor-backend -f
```

### Voir les logs Nginx
```bash
tail -f /var/log/nginx/error.log
```

### Vérifier MongoDB
```bash
systemctl status mongodb
mongo --eval "db.stats()"
```
