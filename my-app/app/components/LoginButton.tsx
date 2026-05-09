"use client";

import Script from "next/script";

export default function LoginButton({ clientId }: { clientId: string }) {
  const handleClick = () => {
    google.accounts.oauth2
      .initCodeClient({
        client_id: clientId,
        scope:
          "openid email https://www.googleapis.com/auth/generative-language.retriever",
        ux_mode: "redirect",
        redirect_uri: "http://localhost:3001/oauth2callback",
      })
      .requestCode();
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
      >
        Login with Google
      </button>
    </>
  );
}
