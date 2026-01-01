# Production Backend

Proxy backend for Production UI. Forwards requests to the main API server.

## Features

- ✅ Login endpoint
- ✅ Get all clients
- ✅ Get all moby clients
- ✅ Create/Read/Update/Delete clients
- ✅ CORS enabled
- ✅ Bearer token authorization
- ✅ Error handling

## Local Setup

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Production

```bash
npm start
```

## Environment Variables

Create a `.env` file:

```env
PORT=5000
API_BASE_URL=https://api.kushal.kimbal.io
```

## API Endpoints

### Authentication

**POST** `/api/login`
```json
{
  "userNameOrEmailAddress": "user@example.com",
  "password": "password"
}
```

### Clients

**GET** `/api/clients` - Get all clients (requires Bearer token)
**GET** `/api/clients/:id` - Get specific client
**POST** `/api/clients` - Create new client
**PUT** `/api/clients/:id` - Update client
**DELETE** `/api/clients/:id` - Delete client

### Moby Clients

**GET** `/api/mobyclients` - Get all moby clients (requires Bearer token)

### Health

**GET** `/health` - Server health check

## Deployment

### Railway.app

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Add environment variables in Railway dashboard:
   - `PORT=5000`
   - `API_BASE_URL=https://api.kushal.kimbal.io`
4. Deploy!

### Render.com

1. Create new Web Service
2. Connect GitHub repo
3. Set environment:
   - Build: `npm install`
   - Start: `npm start`
4. Add environment variables
5. Deploy!

## Architecture

```
Frontend (React)
    ↓
Backend (Express Proxy)
    ↓
Main API (https://api.kushal.kimbal.io)
```

## Authentication Flow

1. Frontend sends credentials to `/api/login`
2. Backend forwards to main API
3. Backend returns token to frontend
4. Frontend stores token (localStorage/sessionStorage)
5. Frontend includes `Authorization: Bearer <token>` in headers
6. Backend forwards token to main API for subsequent requests
