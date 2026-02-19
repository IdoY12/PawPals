# PawPals 🐕

Like Tinder for dog care — connect dog owners with local sitters via an interactive map.

## Tech Stack
- **Mobile**: React Native (Expo) · TypeScript · Apollo Client · Socket.io
- **Backend**: Node.js · TypeScript · Apollo GraphQL · MongoDB · Socket.io
- **Auth**: JWT · AsyncStorage

## Quick Start

### 1. Run Backend + MongoDB (Docker)
```bash
docker compose up -d
```
Backend runs at `http://localhost:4000/graphql`

### 2. Seed demo data
```bash
cd backend && npm run seed
```

### 3. Run Mobile App
```bash
cd mobile
npm install
npm start
```
Press `i` for iOS Simulator or `a` for Android Emulator.

### Without Docker (manual backend)
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm run dev
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Dog Owner | owner1@example.com | password123 |
| Dog Sitter | sitter1@example.com | password123 |

## Mobile Config
Update `mobile/app.json` → `expo.extra`:
```json
{
  "apiUrl": "http://YOUR_LOCAL_IP:4000",
  "wsUrl": "ws://YOUR_LOCAL_IP:4000"
}
```
Use your machine's local IP (not `localhost`) when testing on a device/simulator.

## Features
- 🗺️ Interactive map with nearby sitters/requests
- 💬 Real-time chat (Socket.io + GraphQL subscriptions)
- 🔐 JWT authentication
- 📍 Geospatial search
- ⭐ Ratings & reviews
- 📸 Profile photo uploads
