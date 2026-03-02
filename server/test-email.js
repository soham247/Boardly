import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './src/utils/email.js';

async function test() {
    console.log("Testing with:");
    console.log("API KEY:", process.env.BREVO_API_KEY ? "Present" : "Missing");
    console.log("SENDER:", process.env.SENDER_EMAIL);

    try {
        const result = await sendEmail({
            to: process.env.SENDER_EMAIL, // sending to self
            subject: "Test Email from Boarda",
            text: "This is a test to see if Brevo works.",
            html: "<h1>Test Email</h1><p>Brevo works!</p>"
        });
        console.log("SUCCESS:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("FAILED.");
    }
}

test();
