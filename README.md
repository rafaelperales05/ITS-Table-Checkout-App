# ITS Table Checkout Management System

A web application to replace Excel-based table checkout systems. Built with React, Node.js, and PostgreSQL.

## Tech Stack

- Frontend: React 18, Tailwind CSS, Axios
- Backend: Node.js, Express.js, Sequelize ORM
- Database: PostgreSQL

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ or Docker
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd ITS-Table-Checkout-App
npm run install-all
```

### 2. Database Setup (Docker)

```bash
docker run --name postgres-tables -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=table_checkout_db -p 5432:5432 -d postgres:13
```

### 3. Environment Configuration

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_checkout_db
DB_USER=postgres
DB_PASSWORD=password123
NODE_ENV=development
```

### 4. Initialize Database

```bash
cd server
npm run seed
```

### 5. Start Application

```bash
npm run dev
```
