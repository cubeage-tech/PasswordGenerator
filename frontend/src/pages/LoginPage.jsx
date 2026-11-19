import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", data.access_token);
      storage.setItem("user_name", data.full_name);
      toast.success("Login successful!");
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_24px_80px_-28px_rgba(53,36,150,0.28)] md:grid-cols-[38%_62%]">
        <aside className="flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF0FF] via-[#E6E9FF] to-[#D9DFFF] px-6 py-8 text-center sm:px-10 md:px-8 lg:px-12">
          <div className="rounded-3xl bg-brand p-5 text-5xl text-white shadow-lg"><FaShieldAlt /></div>
          <h1 className="mt-4 text-4xl font-extrabold text-ink">MyPass</h1>
          <h2 className="mt-7 text-2xl font-bold text-ink">Welcome Back!</h2>
          <p className="mt-2 text-indigo-900">Login to access your account.</p>
          <div className="mt-10 flex h-36 w-44 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-500 text-7xl text-white shadow-xl" aria-hidden="true">
            <FaLock />
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-9 sm:px-10 md:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <h2 className="text-center text-3xl font-extrabold text-ink">Login to Your Account</h2>
            <p className="mb-7 mt-2 text-center text-slate-500">Enter your credentials.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="auth-input has-leading-icon" type="email" autoComplete="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="relative">
                <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="auth-input has-leading-icon has-trailing-control" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-[#4325D6]" />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="font-medium text-brand hover:underline">Forgot Password?</Link>
              </div>

              <button disabled={loading} className="primary-btn">{loading ? "Logging in..." : "Login"}</button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Don&apos;t have an account?
              <Link to="/register" className="ml-2 font-bold text-brand">Register</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
