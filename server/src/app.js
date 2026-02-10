import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import healthRouter from './routes/health.routes.js';
import userRouter from './routes/user.routes.js';


// routes declaration
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", userRouter);

export { app };
