import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Email aur password required hai");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Login failed");
        return;
      }

      alert(data.message);

      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login Error:", error);

      alert("Server se connect nahi ho pa raha hai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid md:grid-cols-2">

          {/* Left Side */}
          <div className="bg-slate-800 text-white p-8 md:p-10 flex flex-col justify-center">
            <h1 className="text-3xl font-bold mb-3">
              Fleetrova
            </h1>

            <p className="text-slate-300 mb-6">
              Admin Users Login Only
            </p>

            <div className="border-t border-slate-600 pt-5">
              <p className="text-sm text-slate-400">
                Welcome back!
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Please login to continue.
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="p-8 md:p-10">

            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-gray-800">
                Login
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Enter your details to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email ID
                </label>

                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>

              {/* Password */}
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                />
              </div>

              {/* Remember Me / Forgot Password */}
              <div className="flex items-center justify-between mb-6">

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-slate-700"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm text-slate-700 hover:underline"
                >
                  Forgot Password?
                </button>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>

            <p className="text-center text-xs text-gray-400 mt-7">
              © 2026 Fleet Management System
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

