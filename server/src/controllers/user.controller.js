import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middlewares/error.middleware.js";
import { fileTypeFromBuffer } from 'file-type';

export const generateAccessAndRefereshTokens = async (userId) => {
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

export async function createNewUser(fullName, email, username, password) {
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
        username: username.toLowerCase(),
        isOnboarded: false
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new AppError(500, "Something went wrong while registering the user");
    }

    return createdUser;
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError(400, "Email and password are required");
    }

    // Auto-generate a username from the email prefix
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let username = emailPrefix;

    // Ensure username is unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError(409, "User with this email already exists");
    }

    // Check if the auto-generated username is taken; if so, append random suffix
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
        const { default: crypto } = await import('crypto');
        username = `${username}_${crypto.randomBytes(2).toString('hex')}`;
    }

    const user = await User.create({
        email,
        password,
        username,
        avatar: "",
        isOnboarded: false,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

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

    // const isDev = process.env.DEVELOPEMENT_MODE === "true";

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
    });
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json({
            user: req.user,
            message: "User fetched successfully"
        })
})

const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(200).json({ users: [] });
    }

    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
        $or: [
            { username: { $regex: escapedQuery, $options: 'i' } },
            { fullName: { $regex: escapedQuery, $options: 'i' } }
        ]
    })
        .select('fullName username avatar email')
        .limit(10);

    return res.status(200).json({
        users,
        message: "Users fetched successfully"
    });
});

const finishOnboarding = asyncHandler(async (req, res) => {
    const { fullName, profession, username } = req.body;

    if (!fullName || !profession) {
        throw new AppError(400, "Full name and profession are required");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new AppError(404, "User not found");
    }

    user.fullName = fullName;
    user.profession = profession;
    if (username) user.username = username.toLowerCase(); // Optional update if needed
    user.isOnboarded = true;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json({
            user,
            message: "Onboarding completed successfully"
        });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(44, "User with this email does not exist");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.forgotPasswordOTP = otp;
    user.forgotPasswordOTPExpiry = otpExpiry;

    await user.save({ validateBeforeSave: false });

    // Mock sending email
    console.log(`[FORGOT PASSWORD OTP] Email: ${email}, OTP: ${otp}`);

    return res.status(200).json({
        message: "OTP sent to your email"
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new AppError(400, "Email, OTP and new password are required");
    }

    const user = await User.findOne({
        email,
        forgotPasswordOTP: otp,
        forgotPasswordOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError(400, "Invalid or expired OTP");
    }

    user.password = newPassword;
    user.forgotPasswordOTP = undefined;
    user.forgotPasswordOTPExpiry = undefined;

    await user.save();

    return res.status(200).json({
        message: "Password reset successfully"
    });
});

export {
    getCurrentUser,
    searchUsers,
    finishOnboarding,
    forgotPassword,
    resetPassword
}
