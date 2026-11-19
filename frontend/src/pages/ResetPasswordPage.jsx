import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";

export default function ResetPasswordPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Prefer a URL fragment so the one-time token is not sent in HTTP requests or referrers.
  const fragmentParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const token = fragmentParams.get("token") || searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const checks = [
    ["At least 8 characters", password.length >= 8],
    ["One uppercase letter (A-Z)", /[A-Z]/.test(password)],
    ["One lowercase letter (a-z)", /[a-z]/.test(password)],
    ["One number (0-9)", /[0-9]/.test(password)],
    ["One special character", /[^A-Za-z0-9]/.test(password)],
  ];
  const passwordValid = checks.every(([, valid]) => valid);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is missing or invalid. Request a new link.");
      return;
    }
    if (!passwordValid) {
      toast.error("Choose a password that meets all security requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });
      setComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Password reset failed. Request a new reset link.");
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
        <h1 className="mt-6 text-center text-3xl font-extrabold text-ink">
          {complete ? "Password Updated" : "Reset Your Password"}
        </h1>

        {complete ? (
          <div className="mt-5 text-center">
            <p className="text-slate-600">Your password has been updated securely. Sign in with your registered email and new password.</p>
            <Link to="/login" className="primary-btn mt-7 inline-block text-center">Go to Login</Link>
          </div>
        ) : !token ? (
          <div className="mt-5 text-center">
            <p className="text-slate-600">This reset link is missing or invalid. Request a new link to continue.</p>
            <Link to="/forgot-password" className="primary-btn mt-7 inline-block text-center">Request Reset Link</Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-slate-500">Create a new secure password for your account.</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="relative">
                <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="auth-input has-leading-icon has-trailing-control"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="New Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {password && (
                <ul className="grid grid-cols-1 gap-1 rounded-xl bg-indigo-50 p-3 text-xs sm:grid-cols-2">
                  {checks.map(([label, valid]) => (
                    <li key={label} className={valid ? "text-green-700" : "text-slate-500"}>
                      {valid ? "OK" : "-"} {label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="relative">
                <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="auth-input has-leading-icon has-trailing-control"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button type="button" aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                </p>
              )}
              <button className="primary-btn" disabled={loading || !passwordValid || !passwordsMatch}>
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </>
        )}

        {!complete && (
          <p className="mt-7 text-center text-sm text-slate-600">
            <Link to="/login" className="font-bold text-brand">Back to Login</Link>
          </p>
        )}
      </section>
    </main>
  );
}
