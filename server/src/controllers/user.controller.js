import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middlewares/error.middleware.js";
import { fileTypeFromBuffer } from 'file-type';

const generateAccessAndRefereshTokens = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => !field?.trim())) {
        throw new AppError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new AppError(409, "User with email or username already exists");
    }

    const user = await User.create({
        fullName,
        avatar: "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new AppError(500, "Something went wrong while registering the user");
    }

    res.status(201).json({
        user: createdUser,
        message: "User registered Successfully"
    });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new AppError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new AppError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const isDev = process.env.DEVELOPEMENT_MODE === "true";

    const accessOptions = {
        httpOnly: true,
        secure: true,
        sameSite: isDev ? "strict" : "none",
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000
    };

    const refreshOptions = {
        httpOnly: true,
        secure: true,
        sameSite: isDev ? "strict" : "none",
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessOptions)
        .cookie("refreshToken", refreshToken, refreshOptions)
        .json({
            user: loggedInUser,
            accessToken,
            refreshToken,
            message: "User logged In Successfully"
        });
});



const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message: "User logged Out" });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new AppError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new AppError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const accessOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000
    };

    const refreshOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000
    };

    res.status(200)
        .cookie("accessToken", accessToken, accessOptions)
        .cookie("refreshToken", refreshToken, refreshOptions)
        .json({
            accessToken,
            refreshToken,
            message: "Access token refreshed"
        });
});

const updateProfile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError(400, "No file uploaded");
    }

    // MIME type check from multer (already happened but good to be safe)
    if (!req.file.mimetype.startsWith("image/")) {
        throw new AppError(400, "File must be an image");
    }

    // Magic number check
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (!type || !type.mime.startsWith("image/")) {
        throw new AppError(400, "Invalid file content (not an image)");
    }

    const result = await uploadToCloudinary(req.file.buffer);

    if (!result || !result.secure_url) {
        throw new AppError(500, "Failed to upload image to cloud storage");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: result.secure_url },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
    });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateProfile
}
