import { GoogleLogin } from "@react-oauth/google";

export default function Login({ onLoginSuccess }) {
  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("/auth/google/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        console.error("Login failed", data.error);
      }
    } catch (err) {
      console.error("Login error", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Personal Task Manager</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
        />
      </div>
    </div>
  );
}
