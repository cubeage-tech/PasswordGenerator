import { useState } from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaLaptop } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { full_name: fullName, email });
      setRegisteredEmail(data.email || email);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === "string" ? detail : detail?.message;
      toast.error(message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="registration-shell flex min-h-screen items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
      <div className="registration-card grid w-full max-w-6xl overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-[0_24px_80px_-28px_rgba(53,36,150,0.28)] md:grid-cols-[38%_62%]">
        <div className="brand-panel flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF0FF] via-[#E6E9FF] to-[#D9DFFF] px-6 py-8 text-center sm:px-10 md:px-8 lg:px-12">
          <div className="relative rounded-3xl bg-brand p-5 text-5xl text-white shadow-lg">
            <FaShieldAlt /><FaLock className="absolute bottom-4 left-1/2 -translate-x-1/2 text-lg" />
          </div>
          <h1 className="mt-4 text-4xl font-extrabold text-ink">MyPass</h1>
          <p className="mt-3 text-lg text-indigo-900">Smart Password Generator<br />&amp; Account Security</p>
          <div className="brand-illustration relative mt-10 flex h-40 w-52 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-500 shadow-xl sm:mt-12">
            <FaLaptop className="text-8xl text-white" /><FaCheckCircle className="absolute -right-4 bottom-3 text-5xl text-green-500" />
          </div>
          <p className="mt-8 font-semibold text-brand">Your Password. Your Security.</p>
        </div>

        {registeredEmail ? (
          <section className="register-panel flex min-w-0 items-center justify-center px-5 py-10 text-center sm:px-10 md:px-8 lg:px-12" aria-live="polite">
            <div className="w-full max-w-[30rem]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600"><FaCheckCircle className="text-5xl" /></div>
              <h2 className="mt-6 text-3xl font-extrabold text-ink">Registration Successful</h2>
              <p className="mt-4 leading-7 text-slate-600">Your account has been created. Please check your email for your generated password.</p>
              <p className="mt-4 break-all font-semibold text-brand">{registeredEmail}</p>
            </div>
          </section>
        ) : (
          <section className="register-panel flex min-w-0 items-center justify-center px-5 py-6 sm:px-10 md:px-8 md:py-5 lg:px-12">
            <div className="w-full max-w-[30rem]">
              <h2 className="text-center text-3xl font-extrabold text-ink">Create Your Account</h2>
              <p className="mb-7 mt-2 text-center text-slate-500">Get started with a secure account</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input className="auth-input has-leading-icon" name="full_name" autoComplete="name" placeholder="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} required />
                </div>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input className="auth-input has-leading-icon" type="email" name="email" autoComplete="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="primary-btn">{loading ? "Creating Account..." : "Generate Password"}</button>
              </form>
              <div className="my-5 flex items-center gap-4 text-sm text-slate-400"><div className="h-px flex-1 bg-slate-200" />or<div className="h-px flex-1 bg-slate-200" /></div>
              <p className="text-center text-sm">Already have an account?<Link to="/login" className="ml-2 font-bold text-brand">Login</Link></p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
