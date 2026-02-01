# Matrix VPS Monitor - PRD

## Original Problem Statement
Créer une application de surveillance VPS OVH (51.210.242.96) avec style Matrix. Login par email, affichage des métriques VPS, possibilité de cocher/décocher les métriques à surveiller. Installation dans /opt/vps-monitor/ sur le VPS.

## Architecture
- **Frontend**: React + Tailwind CSS + Recharts
- **Backend**: FastAPI + Motor (MongoDB async)
- **Database**: MongoDB
- **Auth**: JWT tokens avec bcrypt

## User Personas
- **Admin VPS**: Loïc - Surveille son VPS OVH, veut voir CPU/RAM/Disque/Réseau en temps réel

## Core Requirements (Static)
1. ✅ Authentification par email/password
2. ✅ Dashboard temps réel avec métriques VPS
3. ✅ Graphiques CPU historique
4. ✅ Liste des processus actifs
5. ✅ Liste des services systemd
6. ✅ Liste des applications installées
7. ✅ Paramètres pour activer/désactiver les métriques
8. ✅ Style Matrix (vert sur noir, effet pluie de code)

## What's Been Implemented (2026-02-01)
- Page login avec effet Matrix Rain
- Dashboard complet avec 5 métriques principales
- Graphique historique CPU (Recharts)
- Tableaux processus/services/applications
- Panneau paramètres avec checkboxes
- API REST complète avec auth JWT
- Données VPS simulées (MOCKED)

## P0/P1/P2 Features Remaining
### P1 - High Priority
- Agent réel pour collecter les vraies métriques du VPS

### P2 - Nice to Have
- Alertes quand CPU/RAM dépasse un seuil
- Export des données en CSV
- Notifications par email

## Next Tasks
1. Déployer sur le VPS OVH dans /opt/vps-monitor/
2. Configurer Nginx et le service systemd
3. Installer l'agent de collecte de métriques réelles
