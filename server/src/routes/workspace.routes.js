import { Router } from "express";
import {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember
} from "../controllers/workspace.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Secure all routes

router.route("/")
    .post(createWorkspace)
    .get(getWorkspaces);

router.route("/:id")
    .get(getWorkspaceById)
    .patch(updateWorkspace)
    .delete(deleteWorkspace);

router.route("/:id/members")
    .post(addMember);

router.route("/:id/members/:memberId")
    .delete(removeMember);

export default router;
