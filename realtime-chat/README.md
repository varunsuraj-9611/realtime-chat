# Real-Time Chat Application

React + Express + Socket.io + MongoDB chat app.

## Features
- JWT authentication
- One-to-one and group-ready conversations
- Real-time messages
- Online/offline presence
- Typing indicator
- Read receipts
- Message history
- Responsive interface

## Run
### Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Client
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app uses Socket.io for live events. Messages are persisted in MongoDB.
