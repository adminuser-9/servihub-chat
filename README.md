# ServiHub Real-Time Chat Service

A Web-based real-time chat system that allows customers to communicate directly with businesses on the ServiHub platform. This service supports 1-to-1 conversations, multi-agent support rooms, presence and typing indicators, and offline message notifications. It is built using Fastify, WebSockets, PostgreSQL (via Prisma), and Redis.

---

## 🚀 Features

### ✅ Core Capabilities

* **Real-time messaging** with WebSocket-first communication and SSE fallback
* **1-to-1 conversations** between a customer and a business (direct support)
* **Multi-agent support rooms**: any staff with `AGENT` role can join and reply
* **Presence & typing indicators** via Redis pub/sub
* **Offline notifications** using platform-triggered push/email hooks
* **Unread badge support** for new messages
* **JWT-based authentication** with ServiHub-issued tokens

### 🎁 Stretch Features

* Community broadcast room (business announcements to opt-in users)
* Soft delete (`deletedAt`) support for messages
* Reaction table support (emoji responses)

---

## 📦 Tech Stack

| Layer      | Tech                           |
| ---------- | ------------------------------ |
| Backend    | Fastify, TypeScript            |
| Real-time  | WebSocket (@fastify/websocket) |
| Auth       | JWT (@fastify/jwt)             |
| DB         | PostgreSQL (Prisma ORM)        |
| State sync | Redis (ioredis)                |
| Frontend   | React (ChatWidget), MUI        |
| Testing    | Jest, Supertest                |
| CI/CD      | GitHub Actions                 |
| Hosting    | Render (app, DB, Redis)        |

---

## 📁 Project Structure

```bash
chat-servihub/
├── src/                     # Fastify server code
│   ├── routes/             # REST endpoints (auth, conversations, business)
│   ├── plugins/            # WebSocket plugin
├── client/                 # ChatWidget React frontend
├── prisma/                 # Prisma schema and seed script
├── tests/                  # Jest unit/integration tests
├── .github/workflows/      # CI pipeline
├── Dockerfile              # Production build
├── docker-compose.yml      # Local Redis/Postgres stack
├── README.md               # Project documentation
└── DEPLOY.md               # Deployment instructions
```

---

## 🧪 Testing

* Run all tests:

  ```bash
  pnpm jest
  ```
* Minimum 80% test coverage required
* Includes unit tests for REST routes and integration tests for WebSocket events

---

## 🛠 Setup (Local)

### 1. Clone and install

```bash
git clone https://github.com/your-org/chat-servihub.git
cd chat-servihub
pnpm install
```

### 2. Environment variables

Create a `.env` file:

```env
PORT=3000
JWT_SECRET=supersecret
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/servihub
CORS_ORIGIN=http://localhost:5174
```

### 3. Start services

```bash
docker-compose up -d
pnpm prisma migrate dev --name init
pnpm prisma db seed
pnpm dev
```

### 4. Run frontend

```bash
cd client
pnpm install
pnpm dev
```

---

## 🧩 API Overview

### REST Endpoints

* `GET /api/conversations/:id/messages` – Fetch conversation history
* `POST /api/auth/login` – Authenticate and receive JWT
* `GET /health` – Health check

### WebSocket

* Connect to: `wss://servihub-chat.onrender.com/ws?conversationId=ID&token=JWT`
* Message Types:

  * `{ type: 'message', body: string }`
  * `{ type: 'typing' }`
  * `{ type: 'status', status: 'online' | 'offline' }`

---

## 🌐 Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step deployment instructions.

### Demo URLs


* **Website**: [https://servihub-chat.onrender.com](https://servihub-chat.onrender.com)

---

## 📋 Architecture Summary

* Stateless Fastify nodes with Redis for fan-out
* Prisma-backed PostgreSQL DB with compound indexes
* WebSocket-first comms with ping fallback
* Rate limiting via @fastify/rate-limit and Redis store
* JSON logging and health endpoint for monitoring

![Architecture](docs/chat-architecture.png)

---

## 📜 License

MIT License. Built by the ServiHub team.
