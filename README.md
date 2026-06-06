# mini-Trello 🗂️

A lightweight, self-hostable multi-user task management system — like Trello but without the bloat.

## Features

- JWT-based authentication (register / login)
- Boards with columns: To Do / In Progress / Done
- Draggable cards with title, description, assignee, due date, and priority
- Real-time updates via WebSockets
- Role-based access: Admin vs Member
- Free-tier deployable (Render + Vercel)

## Tech Stack

| Layer    | Technology                 |
|----------|----------------------------|
| Frontend | React + Vite + TailwindCSS |
| Backend  | Node.js + Express          |
| Database | PostgreSQL                 |
| Realtime | Socket.io                  |
| Auth     | JWT                        |
| Deploy   | Render (API) + Vercel (UI) |

## Live Demo

> Link will be added after deployment.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Raghu1611/-mini-Trello-.git
cd -mini-Trello-

# Install backend deps
cd server && npm install

# Install frontend deps
cd ../client && npm install

# Copy and fill in env vars
cp server/.env.example server/.env

# Run dev servers (two terminals)
cd server && npm run dev
cd client && npm run dev
```

## Project Structure

```
mini-Trello/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # Auth & socket context
│   │   ├── services/       # API call helpers
│   │   └── utils/
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/         # DB models / queries
│   │   ├── routes/         # Express routers
│   │   ├── sockets/        # Socket.io event handlers
│   │   └── utils/
│   └── .env.example
├── .github/
│   └── workflows/          # CI/CD pipelines
└── README.md
```

## Environment Variables

See `server/.env.example` for required variables.

## License

MIT
