import { Router } from "express";
import { handleGithubCallback, getGithubAuthUrl } from "../controllers/oauth.controller.js";

const router = Router();

router.route("/github").get(getGithubAuthUrl);
router.route("/callback/github").get(handleGithubCallback);

export default router;