# Boarda Server

The backend API for Boarda, built with Node.js and Express.

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

or manually create a `.env` file with the following standard configuration:

```env
PORT=8000
CORS_ORIGIN=*
# Add MongoDB URI later
# MONGO_URL=mongodb://localhost:27017/boarda
```

### Running Locally

To start the server in development mode (with nodemon):

```bash
npm run dev
```

To start in production mode:

```bash
npm start
```

The server will run on `http://localhost:8000` (or your defined PORT).

## API Documentation

### Health Check
- **Endpoint**: `/api/v1/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "OK",
    "message": "Health check passed"
  }
  ```
