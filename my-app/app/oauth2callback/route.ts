import { readFileSync } from "fs";
import { join } from "path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const secretPath = join(process.cwd(), "..", "oauth2-client-secret.json");
  const secret = JSON.parse(readFileSync(secretPath, "utf-8"));
  const { client_id, client_secret, token_uri } = secret.web;

  const tokenRes = await fetch(token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: "http://localhost:3001/oauth2callback",
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const user = await userRes.json();

  (await cookies()).set("user_info", JSON.stringify(user), {
    httpOnly: true,
    maxAge: 3600,
  });

  (await cookies()).set("access_token", tokens.access_token, {
    httpOnly: true,
    maxAge: 3600,
  });

  redirect("/profile");
}
