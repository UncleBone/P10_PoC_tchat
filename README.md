# PoC Tchat Temps Réel — Your Car Your Way

Preuve de concept validant la faisabilité du module de tchat de **Your Car Your Way**.

Cette PoC démontre le cycle complet d'un message :
**Interface React (`front-poc`) ⇄ WebSocket (`Socket.io`) ⇄ Bus d'événements (`Redis Pub/Sub`) ⇄ Persistance (`PostgreSQL`)**

### Flux d'un message

1. Le client front émet chat:send via WebSocket (session_id, user_id, message_content).

2. Le backend enregistre le message dans la table PostgreSQL chat_messages.

3. Le backend publie l'événement enrichi (avec le role de l'expéditeur) sur le canal Redis ycyw:chat:messages.

4. L'abonné Redis reçoit l'événement et diffuse chat:message à tous les sockets connectés à la room session_id.

---

## Architecture & Structure du dépôt

```text
poc-tchat/
├── backend/                  # Serveur Node.js / Express / Socket.io
│   ├── src/
│   │   ├── config/
│   │   │   └── clients.js    # Connexions PostgreSQL et Redis
│   │   ├── db/
│   │   │   └── init.sql      # Schéma minimal (users, chat_messages)
│   │   ├── events/
│   │   │   └── chatBus.js    # Publication et abonnement au canal Redis Pub/Sub
│   │   ├── sockets/
│   │   │   └── chatSocket.js # Gestion des sessions, historique et diffusion temps réel
│   │   └── server.js         # Point d'entrée HTTP & WebSocket
│   ├── .env.example          # Modèle de configuration locale
│   └── package.json
├── front-poc/                # Client React minimal (Vite + socket.io-client)
│   ├── src/
│   │   └── App.jsx           # Interface de test
│   └── package.json
├── docker-compose.yml        # PostgreSQL 16 + Redis 7
└── README.md
```



## Prérequis

- Node.js (v20 ou supérieure) et npm

- Docker et Docker Compose

- Git

## Installation et démarrage en local
### Étape 1 — Cloner le dépôt et préparer les variables d'environnement

```bash
git clone https://github.com/UncleBone/P10_PoC_tchat.git
cd P10_PoC_tchat
cd backend
cp .env.example .env
```
(Le fichier backend/.env contient déjà les identifiants par défaut correspondant au docker-compose.yml.)

### Étape 2 — Démarrer PostgreSQL et Redis

Depuis la racine du projet (P10_PoC_tchat/) :
```bash
docker compose up -d
```
Note : Au tout premier démarrage, PostgreSQL exécute automatiquement backend/src/db/init.sql pour créer les tables `users` et `chat_messages` ainsi que deux utilisateurs de test (client et agent).

### Étape 3 — Démarrer le backend
Dans un premier terminal :
```bash
cd backend
npm install
npm run dev
```

Les confirmations de connexion à PostgreSQL et Redis doivent s'afficher, puis : **Serveur PoC tchat démarré sur http://localhost:3001** (vérifiable via `http://localhost:3001/health`).

### Étape 4 — Démarrer le front de test
Dans un second terminal :
```bash
cd front-poc
npm install
npm run dev
```

L'URL du tchat est affichée par Vite (généralement `http://localhost:5173`).

## Tester la fonctionnalité de tchat
1. Ouvrir deux onglets à l'adresse du tchat (`http://localhost:5173`).
2. Vérifier que les deux onglets affichent **Statut WebSocket : Connecté (3001)** et utilisent le même Session ID (par exemple : session-demo-1).
3. Dans l'onglet 1, sélectionner le profil **Client** ; dans l'onglet 2, sélectionner le profil **Agent**.
4. Envoyer un message depuis l'onglet 1 ou 2 : 
	- Il apparaît instantanément dans les deux onglets (validation WebSocket ⇄ bus d'évènements).
5. Rafraîchir un onglet (F5) : 
	- L'historique de la conversation se recharge automatiquement (validation de la persistance).


## Tableau des événements WebSocket
|  événement    |   Sens        |    Payload    |     Rôle      |
|---------------|---------------|---------------|---------------|
| chat:join     | Front => Back | { session_id }| Rejoint une session et demande l'historique |
| chat:history  | Back => Front | Array<Message>| Retourne les 50 derniers messages de la session |
| chat:send     | Front => Back | { session_id, user_id, message_content } | Envoie un nouveau message  |
| chat:message  | Back => Front | { id, user_id, role, session_id, message_content, sent_at }  | Diffuse le message validé à la session    |

## Périmètre 
Cette PoC est volontairement limitée à la validation technique du tchat :

- **Pas d'authentification JWT** : Les deux utilisateurs de test sont pré-insérés en base et sélectionnables dans l'interface
- **JavaScript (ESM) au lieu de TypeScript** : La PoC utilise Node.js en JavaScript standard pour accélérer la mise en place ; l'application cible suivra la stack TypeScript définie dans le dossier d'architecture.
- **Interface minimale** : Aucun habillage CSS avancé n'est intégré afin de concentrer la revue sur le flux réseau et la persistance.
