import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Receive request: send-keys-request");

        // 2. Parse Body
        const { userEmail } = await req.json();
        console.log(`Processing request for email: ${userEmail}`);

        if (!userEmail) {
            console.error("Missing userEmail in request body");
            throw new Error("User email is required");
        }

        // 3. Check Secrets
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        console.log(`Secrets Check - SMTP_USER exists: ${!!smtpUser}, SMTP_PASS exists: ${!!smtpPass}`);

        if (!smtpUser || !smtpPass) {
            console.error("SMTP credentials missing from environment");
            throw new Error("SMTP credentials are not configured");
        }

        // 4. Create Transporter
        console.log("Creating Nodemailer transporter...");
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const mailOptions = {
            from: smtpUser,
            to: "pelsallsongsandsermons@pech.co.uk",
            subject: "Request for Transcription Keys - Pelsall Songs & Sermons",
            text: `A user has requested transcription keys for the Pelsall Songs & Sermons app.

User Email: ${userEmail}

Please generate the necessary keys (Deepgram/OpenAI) and send them to the user.`,
        };

        // 5. Send Mail
        console.log("Attempting to send email...");
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);

        return new Response(JSON.stringify({ message: "Request sent successfully", info: info.response }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Handler Error:", error);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);

        const isConfigError = error.message === "SMTP credentials are not configured";

        return new Response(JSON.stringify({
            error: error.message,
            details: "Check function logs for stack trace"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: isConfigError ? 500 : 400,
        });
    }
});
