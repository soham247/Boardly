# Boarda

Boarda is a lightweight, developer-friendly Kanban project management tool built for teams and open-source contributors who want clarity without clutter.

## Core Philosophy

- **Beginner-friendly**: Clear folder structure, good docs, labeled issues.
- **Opinionated MERN**: Enforces clean MERN best practices.
- **No bloat**: Only essential Kanban features.
- **OSS-first**: Built to grow through community contributions.

## Info & Setup

This repository contains both the client and server code.

### Prerequisites

- Node.js installed on your machine.
- Git.

### Getting Started

1. **Star the repository**

2. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/boarda.git
   cd boarda
   ```

3. **Setup Client & Server**:
   - **Frontend**: See [Client Setup Instructions](./client/README.md) for details on setting up the React application.
   - **Backend**: See [Server Setup Instructions](./server/README.md) for details on setting up the Node.js/Express API (check `.env.example` for environment configuration).

## ✅ Core Features (MVP)

### 🧭 Dashboard

- View all boards you own or are a member of
- See tasks assigned to you across boards
- Clean, text-first layout with no visual clutter
- Quick access to create a new board

---

### 🗂 Boards

- Create multiple boards for different projects
- Rename boards
- Delete boards (admin only)
- Default Kanban workflow:
  - Backlog
  - In Progress
  - Review
  - Done

---

### 📋 Tasks

- Create tasks within a board
- Edit the task details
- Delete tasks (permission-based)
- Task fields include:
  - Title
  - Description (Markdown supported)
  - Status
  - Priority (Low / Medium / High)
  - Assignee
  - Tags
  - Created and updated timestamps

---

### 🔁 Kanban Workflow

- Drag and drop tasks between columns
- Automatically update task status on move
- Optimistic UI updates for smooth interaction

---

### 🧾 Task Details

- Focused task detail view in a modal
- View and edit task metadata
- Comment on tasks
- Minimal layout to reduce distraction

---

### 👥 Collaboration & Sharing

- Invite users to boards
- Share boards with specific permissions:
  - Admin – full control
  - Editor – create and edit tasks
  - Viewer – read-only access
- View-only board sharing via link
- Edit access restricted to invited users

---

### 🔐 Authentication & Security

- Email and password authentication
- Secure password hashing
- JWT-based authentication
- Protected API routes
- Role-based access control

---

### 💎 Subscription Tiers

- **Free Tier**: Standard access to board creation and task management.
- **Premium Tier**: Unlocks advanced features (future planned features).
- **Tier Check**: Backend validation to ensure users access features according to their subscription status.

---

### 🎨 Minimal UI/UX

- Clean, distraction-free interface
- Text-first design
- No unnecessary animations
- Consistent spacing and typography
- Designed for developers and open-source contributors

---

## 🧭 Planned & Future Features

The following features are intentionally planned for future versions once the core experience is stable.

---

### 🔄 Realtime Collaboration

- Live task updates across users
- Real-time drag and drop syncing
- Presence indicators

---

### 📜 Activity & History

- Task activity log
- Board-level activity feed
- Audit trail for task changes

---

### 🔗 Integrations

- GitHub issue linking
- Import tasks from GitHub issues
- Sync with GitHub repositories

---

### 🧩 Board Customization

- Custom columns
- Column reordering
- Board templates (Sprints, Bugs, Docs)

---

### 🧠 Productivity Enhancements

- Task search
- Advanced filtering (priority, tags, assignee)
- Task sorting
- Due dates and reminders

---

### 🌐 Public Boards

- Public read-only boards
- Shareable public URLs
- Embeddable boards for documentation

---

### 🧑‍🤝‍🧑 Collaboration Improvements

- User mentions in comments
- Notifications
- Comment editing and deletion

---

### 📱 Platform Expansion

- Mobile-optimized UI
- Progressive Web App (PWA)
- Native mobile apps (future consideration)

---

### 🔐 Advanced Permissions

- Granular permission controls
- Guest users
- Board-level audit logs

---

### 📊 Insights (Low Priority)

- Task completion statistics
- Simple progress summaries
- Lightweight productivity insights

---

## 🎯 Philosophy

OpenBoard intentionally avoids feature bloat.
New features are added only if they:

- Improve clarity
- Preserve simplicity
- Enhance collaboration without complexity

The goal is to remain minimal, predictable, and developer-friendly.

## License

MIT
