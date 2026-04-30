import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Chat from "../components/Chat";

export default async function Profile() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user_info");

  if (!userCookie) redirect("/");

  const user = JSON.parse(userCookie.value);

  return (
    <div className="flex flex-col items-center min-h-screen py-10 gap-6">
      <h1 className="text-3xl font-bold">User Info</h1>
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-4">
          <img
            src={user.picture}
            alt="avatar"
            className="w-24 h-24 rounded-full"
          />
          <div className="text-center space-y-2">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
        </div>
      </div>
      <Chat />
      <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
    </div>
  );
}
