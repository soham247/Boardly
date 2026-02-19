import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middlewares/error.middleware.js";
import { generateAccessAndRefereshTokens, createNewUser } from "./user.controller.js";
import crypto from 'crypto';

const handleGithubCallback = asyncHandler(async (req, res) => {
    const { code } = req.query;

    if (!code) {
        throw new AppError(400, "Authorization code is missing");
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new AppError(400, `GitHub OAuth error: ${tokenData.error_description}`);
        }

        const accessToken = tokenData.access_token;

        // Fetch user profile
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!userResponse.ok)
            throw new AppError(502, "Failed to fetch user profile from GitHub");

        const githubUser = await userResponse.json();

        // Fetch user emails
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!emailsResponse.ok)
            throw new AppError(502, "Failed to fetch user emails from GitHub");

        const emails = await emailsResponse.json();

        let primaryEmail = null;
        if (Array.isArray(emails)) {
            primaryEmail = emails.find(email => email.primary && email.verified)?.email || emails[0]?.email;
        } else {
            primaryEmail = githubUser.email;
        }

        if (!primaryEmail) {
            throw new AppError(400, "Could not verify email from GitHub");
        }

        // Check if user exists by email
        let user = await User.findOne({ email: primaryEmail });

        if (!user) {
            // User with this email doesn't exist. 
            // Check if username is taken
            const existingUsername = await User.findOne({ username: githubUser.login.toLowerCase() });

            let newUsername = githubUser.login.toLowerCase();
            if (existingUsername) {
                // User exists with this username but DIFFERENT email. 
                // Append random suffix to make username unique
                const randomSuffix = crypto.randomBytes(2).toString('hex');
                newUsername = `${newUsername}_${randomSuffix}`;
            }

            const randomPassword = crypto.randomBytes(16).toString('hex');
            const fullName = githubUser.name || githubUser.login;

            user = await createNewUser(fullName, primaryEmail, newUsername, randomPassword);

            // If we have an avatar from GitHub, update it
            if (githubUser.avatar_url) {
                user.avatar = githubUser.avatar_url;
                await user.save({ validateBeforeSave: false });
            }
        }

        const { accessToken: newAccessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

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

        const frontendUrl = `${process.env.CORS_ORIGIN}/workspaces`;

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, accessOptions)
            .cookie("refreshToken", refreshToken, refreshOptions)
            .redirect(frontendUrl);

    } catch (error) {
        throw new AppError(500, error.message || "Error during GitHub authentication");
    }
});

const getGithubAuthUrl = asyncHandler(async (req, res) => {
    const rootUrl = 'https://github.com/login/oauth/authorize';

    // Generate CSRF-protecting state
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in secure cookie
    res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
    });

    const options = {
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${process.env.API_URL}/api/v1/oauth/callback/github`,
        scope: 'user:email',
        state
    };

    const qs = new URLSearchParams(options);
    const url = `${rootUrl}?${qs.toString()}`;

    return res.redirect(url);
});


export {
    handleGithubCallback,
    getGithubAuthUrl
}
