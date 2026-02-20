import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000" //NOTE FROM DEVELOPER: If someone prefers a different port they can add it here.
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import healthRouter from './routes/health.routes.js';
import userRouter from './routes/user.routes.js';
import workspaceRouter from './routes/workspace.routes.js';
import oauthRouter from './routes/oauth.routes.js';
import boardRouter from './routes/board.routes.js';


// routes declaration
app.use("/api/v1", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/oauth", oauthRouter);
app.use("/api/v1/boards", boardRouter);

app.use(errorMiddleware);

export { app };
