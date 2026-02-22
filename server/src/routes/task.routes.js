import { Router } from "express";
import {
    createTask,
    getTasksByBoard,
    updateTask,
    deleteTask
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createTask);
router.get("/board/:boardId", getTasksByBoard);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
