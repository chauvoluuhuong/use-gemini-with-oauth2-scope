import { readFileSync } from "fs";
import { join } from "path";
import LoginButton from "./components/LoginButton";

export default function Home() {
  const secretPath = join(process.cwd(), "..", "oauth2-client-secret.json");
  const secret = JSON.parse(readFileSync(secretPath, "utf-8"));
  const clientId = secret.web.client_id;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-3xl font-bold">Google OAuth2 Demo</h1>
      <LoginButton clientId={clientId} />
    </div>
  );
}
