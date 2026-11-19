import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "We couldn't process that request. Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FF] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl text-white shadow-lg">
          <FaShieldAlt />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-ink">Forgot Password?</h1>
        <p className="mt-2 text-center text-slate-500">Enter the email address registered with MyPass.</p>

        {submitted ? (
          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center text-sm leading-6 text-slate-700" role="status">
            If an account exists for that email, a reset link will be sent shortly. The link expires in 30 minutes and can only be used once.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="auth-input has-leading-icon"
                type="email"
                autoComplete="email"
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <button className="primary-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-sm text-slate-600">
          Remember your password?
          <Link to="/login" className="ml-2 font-bold text-brand">Back to Login</Link>
        </p>
      </section>
    </main>
  );
}
