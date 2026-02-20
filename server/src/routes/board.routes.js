import { Router } from "express";
import {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard
} from "../controllers/board.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createBoard);
router.get("/workspace/:workspaceId", getBoards);
router.get("/:id", getBoardById);
router.patch("/:id", updateBoard);
router.delete("/:id", deleteBoard);

export default router;
