# Copilot Instructions for Auto

## Project Overview
Monorepo web application with TypeScript backend and dual React frontends (public-facing and admin). Backend provides REST APIs, WebSocket connections, and JWT authentication.

## Structure
```
backend/
  ├─ prisma/schema.prisma  - Database schema (User, Item models)
  ├─ src/                  - Express + TypeScript API server
  │   ├─ index.ts          - Server entry point
  │   ├─ app.ts            - Express configuration
  │   ├─ auth.ts           - Authentication routes
  │   ├─ data.ts           - Data CRUD routes
  │   ├─ socket.ts         - Socket.io setup
  │   ├─ error.ts          - Error handler
  │   └─ env.ts            - Environment config
  ├─ .env                  - Environment variables (DATABASE_URL, JWT_SECRET, PORT)
  ├─ .env.example          - Example environment file
  ├─ package.json          - Dependencies and scripts
  └─ tsconfig.json         - TypeScript configuration
frontend-public/           - Public-facing React app
  ├─ src/
  │   ├─ main.jsx          - React entry point
  │   ├─ App.jsx           - Main component
  │   └─ api.js            - Backend API URL
  ├─ index.html            - HTML entry
  └─ package.json          - Dependencies
frontend-admin/            - Admin dashboard React app
  ├─ src/
  │   ├─ main.jsx          - React entry point
  │   ├─ App.jsx           - Admin CRUD component
  │   └─ api.js            - Backend API URL
  ├─ index.html            - HTML entry
  └─ package.json          - Dependencies
deploy_onchainweb_env.sh   - Multi-environment deployment script
```

## Architecture Overview
```
                           ┌─────────────────┐
                           │   Internet /    │
                           │  Users/Clients  │
                           └─────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
┌─────────────────────┐                               ┌─────────────────────┐
│ Public App (React)  │                               │ Admin Panel (React)│
│  frontend-public/   │                               │  frontend-admin/   │
│  Served via Nginx   │                               │  Served via Nginx  │
└─────────────────────┘                               └─────────────────────┘
           │                                                   │
           │  HTTP/HTTPS + WebSocket                           │
           └───────────────┐                      ┌────────────┘
                           │                      │
                     ┌─────────────┐
                     │   Nginx     │
                     │ Reverse     │
                     │ Proxy + SSL │
                     └─────────────┘
                           │
              ┌────────────┴─────────────┐
              │ Backend API (Node.js +   │
              │ Express + Prisma)        │
              │  Runs via PM2            │
              └────────────┬─────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
   PostgreSQL Database                Socket.IO Server
   (Persistent Storage)               (Real-time updates)
           │                               │
           └───────────────┬───────────────┘
                           │
                   Real-time events
           (Admin adds/edits/deletes → Public app updates)
```

**Key components**:
- **Nginx**: Serves both frontends on separate subdomains, proxies WebSocket, handles SSL/HTTPS
- **Backend**: Node.js + Express + Prisma running via PM2 for auto-restart and uptime
- **Database**: PostgreSQL for persistent storage of users and items
- **Real-time**: Socket.io integrated - admin actions instantly update public app
- **Deployment**: Script automates full setup (database, PM2, Nginx, SSL) with multi-environment support

## Development Workflow
Each package runs independently:
- **Backend**: 
  1. Set up `.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT`
  2. `cd backend && npm install`
  3. `npm run prisma:generate` (generates Prisma client)
  4. `npm run prisma:migrate` (runs migrations)
  5. `npm run dev` (ts-node-dev with hot reload on port 4000)
- **Public Frontend**: `cd frontend-public && npm install && npm run dev` (Vite dev server)
- **Admin Frontend**: `cd frontend-admin && npm install && npm run dev` (Vite dev server)

Start backend first, then frontends connect via `api.js` modules to `http://localhost:4000`.

### Testing Authentication
To get a token for testing:
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```
Save returned token to `localStorage.token` in browser console.

## Architecture Patterns

### Backend (`backend/src/`)
- **index.ts** - Server entry point, creates HTTP server, initializes Socket.io with CORS (`origin: "*"`)
- **app.ts** - Express app with two main routers: `/auth` (authRouter) and `/data` (dataRouter)
- **env.ts** - Exports `ENV` object with `PORT`, `JWT_SECRET` from `process.env` (uses dotenv)
- **auth.ts** - Exports `authRouter` (register/login with bcrypt) and `guard` middleware, instantiates `PrismaClient`
- **data.ts** - Exports `dataRouter` for CRUD using `PrismaClient`, imports `io` for real-time broadcasts
- **socket.ts** - Exports `initSocket(io)` to initialize global `io` instance, and `io` for use in other modules
- **error.ts** - Exports `errorHandler` middleware, applied last in `app.ts` (returns 500 with `{ error: err.message }`)
- **prisma/schema.prisma** - Database models: `User` (id, username, role, password), `Item` (id, message, createdAt, updatedAt)

Key dependencies: `express`, `socket.io`, `jsonwebtoken`, `cors`, `@prisma/client`, `bcrypt`, `dotenv`
TypeScript config: ES2020 target, CommonJS modules, strict mode enabled

### Frontend Architecture
Both frontends use Vite for development and share similar structure:
- **index.html** - Entry HTML with `<div id="root">` and module script pointing to `src/main.jsx`
- **main.jsx** - React app entry point (React 18 `ReactDOM.createRoot`)
- **App.jsx** - Root component with login flow, state management, and Socket.io connection
- **api.js** - Exports `API` constant (`"http://localhost:4000"`)

Key dependencies: `react`, `react-dom`, `socket.io-client`, `@vitejs/plugin-react`, `vite`
Scripts: `npm run dev` (Vite dev server), `npm run build`, `npm run preview`

**Frontend-public**: Login UI (username input), reads data (GET `/data/`), listens for real-time updates
**Frontend-admin**: Login UI (username input), full CRUD operations:
  - Add: POST `/data/` with `{ message: "New item " + Date.now() }`
  - Edit: PUT `/data/:id` with `{ message: "Updated " + Date.now() }`
  - Delete: DELETE `/data/:id`
  - Real-time sync via Socket.io, renders items in `<ul>` with inline edit/delete buttons

## Key Conventions

### Authentication Flow
1. **Register**: POST `/auth/register` with `{ username, password, role }` - hashes password with bcrypt (10 rounds)
2. **Login**: POST `/auth/login` with `{ username, password }` - validates credentials, returns `{ token, role }`
3. Backend uses `bcrypt.compare()` to verify password against hashed value in `User` table
4. JWT token contains `{ id, username, role }` signed with `ENV.JWT_SECRET`
5. Token stored in `localStorage.token` (or `localStorage.getItem("token")`) on client
6. Client sends token via `Authorization: Bearer ${token}` header
7. Protected routes use `guard()` middleware - returns 401 if missing/invalid token, 403 if role mismatch
8. Role-specific routes use `guard("admin")` - checks `user.role === "admin"`

### Data Storage Pattern
- **Database**: PostgreSQL with Prisma ORM - `PrismaClient` instantiated in each module (`auth.ts`, `data.ts`)
- **Item model**: `{ id, message, createdAt, updatedAt }` with auto-incrementing id and Prisma timestamps
- GET `/data/` - requires auth (`guard()`), returns `await prisma.item.findMany()`
- POST `/data/` - requires admin (`guard("admin")`), creates via `prisma.item.create()`, emits "update" with all items
- PUT `/data/:id` - requires admin, updates via `prisma.item.update()`, emits "update" with all items
- DELETE `/data/:id` - requires admin, deletes via `prisma.item.delete()`, emits "update" with all items

All mutations refetch all items (`prisma.item.findMany()`) and broadcast via `io.emit("update", items)`.
Prisma errors automatically handled by Express error handler (500 responses).

### Real-time Communication
- `socket.ts` exports global `io` instance after `initSocket()` called in `index.ts`
- Connection logging: Logs client connect/disconnect with socket.id
- Other modules import `io` to emit events (e.g., all CRUD operations emit "update")
- Frontends: Connect via `io(API)` in useEffect, listen for "update" event with `socket.on("update", setData)`
- Pattern: Fetch initial data on mount, then socket updates keep it synchronized
- useEffect dependency: `[token]` - reconnects when token changes (after login)

### API Communication
- Frontends use `api.js` abstraction layer - never call fetch directly in components
- Backend routes organized by router: `/auth/*` for authentication, `/data/*` for data operations
- CORS configured to allow all origins (`origin: "*"`) for development
- Error handling centralized in `errorHandler` middleware (always runs last)

## Adding Features
- **New API endpoint**: Add route to `authRouter` or `dataRouter` in respective files, use `guard()` for auth
- **New Prisma model**: Add to `schema.prisma`, run `prisma migrate dev`, import `PrismaClient` in handlers
- **New Socket event**: Import `io` from `socket.ts`, call `io.emit(event, data)` where needed
- **New auth requirement**: Extend `guard` middleware or add new role-based guard variant
- **New frontend feature**: Add component in respective frontend, use `api.js` for backend calls

## Production Deployment

### Automated Deployment (Ubuntu)
For one-command setup, use the deployment script that automates all steps:
1. Installs Node.js, PostgreSQL, Nginx, Certbot, PM2
2. Creates database and user
3. Clones repository and installs dependencies
4. Configures `.env` with database credentials
5. Runs Prisma migrations
6. Builds both frontends
7. Configures Nginx with WebSocket proxy
8. Sets up SSL certificates with Certbot
9. Starts backend with PM2 auto-restart

Script handles: PostgreSQL setup, environment variables, Prisma migrations, frontend builds, Nginx config, SSL/HTTPS

**Multi-environment support**: Advanced script supports `prod`, `staging`, `test` environments with:
- Environment-specific domains (e.g., `staging-public.example.com`)
- Separate databases per environment
- Unique PM2 process names (`onchain-backend-prod`)
- Environment-specific JWT secrets and Nginx configs

Usage: `./deploy_onchainweb_env.sh prod` (or `staging`, `test`)

### Manual Deployment Steps

#### Backend (PM2)
1. Install PM2: `sudo npm install -g pm2`
2. Navigate to backend: `cd backend && npm install`
3. Run migrations: `npx prisma migrate deploy`
4. Start with PM2: `pm2 start src/index.ts --name onchain-backend --watch --interpreter ./node_modules/.bin/ts-node`
5. Save process: `pm2 save && pm2 startup`

PM2 provides: auto-restart on crash, zero-downtime reloads, log management, cluster mode support

#### Frontend (Nginx)
1. Build frontends: `cd frontend-public && npm install && npm run build` (repeat for frontend-admin)
2. Nginx serves static files from `dist/` directories
3. WebSocket proxy requires `Upgrade` headers for Socket.io compatibility
4. Use `try_files $uri /index.html` for React Router (SPA fallback)

### Nginx Configuration Pattern
Complete configuration file example (`/etc/nginx/sites-available/onchainweb`):
```nginx
# Public App
server {
    listen 80;
    server_name public.example.com;

    root /home/ubuntu/onchainweb/frontend-public/dist;
    index index.html;

    location / {
        try_files $uri /index.html;  # SPA fallback
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

# Admin App
server {
    listen 80;
    server_name admin.example.com;

    root /home/ubuntu/onchainweb/frontend-admin/dist;
    index index.html;

    location / {
        try_files $uri /index.html;  # SPA fallback
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/onchainweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Domain setup: Serve public app and admin panel on separate subdomains (e.g., `public.example.com`, `admin.example.com`)
Each subdomain points to respective `dist/` folder, both proxy Socket.io to backend port 4000

### SSL/HTTPS (Certbot)
1. Install Certbot: `sudo apt install certbot python3-certbot-nginx`
2. Generate certificates: `sudo certbot --nginx -d public.example.com -d admin.example.com`
3. Test Nginx config: `sudo nginx -t`
4. Restart Nginx: `sudo systemctl restart nginx`

Auto-renewal enabled by default. WebSocket works automatically over HTTPS.

### PM2 Management
- **List processes**: `pm2 list`
- **View logs**: `pm2 logs onchain-backend`
- **Restart**: `pm2 restart onchain-backend`
- **Stop**: `pm2 stop onchain-backend`
- **Monitor**: `pm2 monit`

Backend auto-restarts on crash or server reboot after `pm2 startup` configuration.

### Verification
After deployment, verify functionality:
1. Access `https://public.example.com` - Public app should load with login
2. Access `https://admin.example.com` - Admin panel should load with login
3. Login as admin, add/edit/delete data
4. Verify real-time updates appear immediately in public app (Socket.io working)

### Optional Production Optimizations
- **Environment config**: Create `.env.prod` with production-specific settings
- **CORS restrictions**: Update `cors({ origin: "*" })` to whitelist specific domains only
- **Firewall**: Configure UFW/iptables to allow only ports 80, 443, and SSH
- **Security**: Install `fail2ban` to protect against brute-force attacks
- **HTTPS enforcement**: Add redirect from HTTP to HTTPS in Nginx config
- **Database**: Use connection pooling and read replicas for scaling
