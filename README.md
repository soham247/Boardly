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

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/boarda.git
    cd boarda
    ```

2.  **Setup Client & Server**:
    - **Frontend**: See [Client Setup Instructions](./client/README.md) for details on setting up the React application.
    - **Backend**: See [Server Setup Instructions](./server/README.md) for details on setting up the Node.js/Express API (check `.env.example` for environment configuration).

## Features (MVP)
- **Boards & Tasks**: Kanban columns, markdown descriptions.
- **Authentication**: JWT, bcrypt, role system.
- **Developer-First**: Typescript, ESLint, modular architecture.

## License
MIT
