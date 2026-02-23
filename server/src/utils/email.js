import SibApiV3Sdk from "sib-api-v3-sdk";

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async ({ to, subject, text, html }) => {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    try {
        const response = await emailApi.sendTransacEmail({
            sender: {
                email: process.env.SENDER_EMAIL,
                name: "Boarda"
            },
            to: [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html
        });
        console.log("Email sent successfully format:", html ? "HTML" : "TEXT");
        return response;
    } catch (error) {
        console.error("Email API Error Response body:", error?.response?.body);
        console.error("Email API Error Message:", error.message);
        throw error;
    }
};
