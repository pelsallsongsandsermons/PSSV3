import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { userEmail } = await req.json();

        if (!userEmail) {
            throw new Error("User email is required");
        }

        // Get SMTP settings from secrets
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        if (!smtpUser || !smtpPass) {
            throw new Error("SMTP credentials are not configured");
        }

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

        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ message: "Request sent successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
