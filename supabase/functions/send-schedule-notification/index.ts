import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper untuk mendapatkan access token Google OAuth2 dari Service Account JSON
async function getAccessToken(serviceAccount: any): Promise<string> {
  const HEADER = JSON.stringify({ alg: "RS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  
  const payload = JSON.stringify({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  });

  const encoder = new TextEncoder();
  const base64UrlEncode = (str: string) => btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedToken = `${base64UrlEncode(HEADER)}.${base64UrlEncode(payload)}`;
  
  // Format private key untuk crypto import
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsignedToken)
  );

  const base64Signature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${base64Signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "";

    if (!serviceAccountStr) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT belum diset di Supabase Secrets.");
    }

    const serviceAccount = JSON.parse(serviceAccountStr);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Dapatkan tanggal dan jam saat ini (WIB / zona waktu lokal Anda)
    // Sesuaikan format dengan kolom schedule_date (YYYY-MM-DD) dan time_slot (HH:MM)
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeSlot = `${currentHours}:${currentMinutes}`;

    console.log(`Mengecek jadwal untuk Tanggal: ${currentDate}, Jam: ${currentTimeSlot}`);

    // Cari jadwal yang waktunya cocok dengan detik/menit ini
    const { data: schedules, error: schedError } = await supabase
      .from("activity_schedules")
      .select("*, children(name)")
      .eq("schedule_date", currentDate)
      .eq("time_slot", currentTimeSlot);

    if (schedError) throw schedError;

    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada jadwal pada waktu ini." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    const results = [];

    for (const sch of schedules) {
      // Ambil FCM Token milik user yang memiliki jadwal ini
      const { data: tokens, error: tokenError } = await supabase
        .from("user_fcm_tokens")
        .eq("user_id", sch.user_id);

      if (tokenError || !tokens || tokens.length === 0) continue;

      const childName = sch.children?.name || "Anak";

      for (const t of tokens) {
        // Payload pesan FCM v1
        const messagePayload = {
          message: {
            token: t.fcm_token,
            notification: {
              title: `⏰ Waktunya Sesi Latihan: ${childName}`,
              body: `Agenda "${sch.activity_title}" (${sch.category}) sudah dimulai pukul ${sch.time_slot} WIB.`,
            },
            webpush: {
              fcm_options: {
                link: "/", // Link tujuan saat notifikasi diklik
              },
            },
          },
        };

        const fcmRes = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messagePayload),
          }
        );

        const fcmResult = await fcmRes.json();
        results.push({ scheduleId: sch.id, fcmResult });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});