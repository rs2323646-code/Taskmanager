# OPS BOARD — Task Management Application (Thiranex Task #2)

A full-stack task manager: authentication, full CRUD on tasks, priority levels, due dates, and a kanban-style board (To Do / In Progress / Done). Dark gunmetal + safety-orange "command center" theme.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **MongoDB** — reuse your existing Atlas cluster, just point to a new database name:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
   Or spin up a fresh cluster at https://cloud.mongodb.com if you'd rather keep it separate.

3. **Create `.env`**
   - Copy `.env.example` → rename to `.env`
   - Paste your real connection string + a JWT secret

4. **Run it**
   ```
   npm start
   ```
   Look for `MongoDB connected` and `Server running on http://localhost:5000`.

5. **Open** `http://localhost:5000`

## How it works

- **Enlist** → creates an account
- **Log in** → unlocks the board and "+ New Task"
- Every user only ever sees their own tasks — authorization is enforced server-side, not just hidden in the UI
- Create a task with a priority (low/medium/high) and optional due date
- Move tasks between columns with **Start** / **Finish** / **Reopen**
- **Edit** or **Delete** any of your own tasks

## Folder structure

```
task-manager/
├── server.js
├── models/            # User, Task
├── routes/            # auth, tasks
├── middleware/auth.js # JWT protect
└── public/            # HTML/CSS/JS frontend
```

## API endpoints

| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/tasks | Logged-in user (own tasks only) |
| POST | /api/tasks | Logged-in user |
| PUT | /api/tasks/:id | Task owner only |
| DELETE | /api/tasks/:id | Task owner only |

Same deploy steps as your last two projects — GitHub push, then a Render web service with the same three env vars (`MONGO_URI`, `JWT_SECRET`, `PORT`).
