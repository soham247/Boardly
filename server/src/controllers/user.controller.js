import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new Error(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = async (req, res) => {
    try {
        const { fullName, email, username, password } = req.body

        if (
            [fullName, email, username, password].some((field) => field?.trim() === "")
        ) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            return res.status(409).json({ message: "User with email or username already exists" })
        }

        const user = await User.create({
            fullName,
            avatar: "",
            coverImage: "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            return res.status(500).json({ message: "Something went wrong while registering the user" })
        }

        return res.status(201).json({
            user: createdUser,
            message: "User registered Successfully"
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, username, password } = req.body

        if (!username && !email) {
            return res.status(400).json({ message: "username or email is required" })
        }

        const user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (!user) {
            return res.status(404).json({ message: "User does not exist" })
        }

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid user credentials" })
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                user: loggedInUser,
                accessToken,
                refreshToken,
                message: "User logged In Successfully"
            })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const logoutUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ message: "User logged Out" })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "unauthorized request" })
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" })
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({ message: "Refresh token is expired or used" })
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json({
                accessToken,
                refreshToken: newRefreshToken,
                message: "Access token refreshed"
            })
    } catch (error) {
        return res.status(500).json({ message: error?.message || "Invalid refresh token" })
    }
}

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}
