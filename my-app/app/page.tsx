import { readFileSync } from "fs";
import { join } from "path";

export default function Home() {
  const secretPath = join(process.cwd(), "..", "oauth2-client-secret.json");
  const secret = JSON.parse(readFileSync(secretPath, "utf-8"));
  const { client_id, auth_uri } = secret.web;

  const authUrl = `${auth_uri}?client_id=${client_id}&redirect_uri=http://localhost:3001/oauth2callback&response_type=code&scope=openid email https://www.googleapis.com/auth/generative-language.retriever&access_type=offline&prompt=consent`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-3xl font-bold">Google OAuth2 Demo</h1>
      <a
        href={authUrl}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
      >
        Login with Google
      </a>
    </div>
  );
}
