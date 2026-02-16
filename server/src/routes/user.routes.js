import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    updateProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from 'multer';
import { User } from "../models/user.model.js";

const router = Router()

const storage = multer.memoryStorage();
const upload = multer({ storage })

router.route('/update-profile').patch(verifyJWT, upload.single('avatar'),updateProfile);

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
