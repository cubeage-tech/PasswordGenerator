import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaCheckCircle, FaSignOutAlt, FaChevronDown, FaUserCircle } from "react-icons/fa";
import api from "../services/api";

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/auth/me")
      .then(({ data }) => { if (active) setUser(data); })
      .catch(() => {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        localStorage.removeItem("user_name");
        sessionStorage.removeItem("user_name");
        if (active) navigate("/login", { replace: true });
      });
    return () => { active = false; };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    sessionStorage.removeItem("user_name");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <nav className="relative z-10 flex items-center justify-between border-b border-indigo-100 bg-white px-5 py-4 shadow-sm sm:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-brand"><FaShieldAlt /> MyPass</h1>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex max-w-[min(60vw,320px)] items-center gap-2 rounded-xl px-3 py-2 font-semibold text-ink hover:bg-indigo-50">
            <FaUserCircle className="shrink-0 text-xl text-brand" />
            <span className="truncate">{user?.full_name || "Loading account…"}</span>
            <FaChevronDown className="shrink-0 text-xs" />
          </button>
          {menuOpen && <div className="absolute right-0 top-full mt-2 min-w-48 rounded-xl border border-indigo-100 bg-white p-2 shadow-lg">
            <p className="break-all px-3 py-2 text-sm text-slate-500">{user?.email}</p>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50"><FaSignOutAlt /> Logout</button>
          </div>}
        </div>
      </nav>

      <main className="relative flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-5 py-16 text-center">
        <div className="absolute inset-x-0 bottom-0 z-0 h-48 overflow-hidden" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#E9ECFF" d="M0,192L60,181.3C120,171,240,149,360,154.7C480,160,600,192,720,197.3C840,203,960,181,1080,160C1200,139,1320,117,1380,106.7L1440,96L1440,320L0,320Z" />
          </svg>
        </div>
        <div className="relative z-10 w-full max-w-2xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-6xl text-green-600 ring-8 ring-green-50/70"><FaCheckCircle /></div>
          <h2 className="mt-8 text-3xl font-extrabold text-ink sm:text-4xl">Welcome, {user?.full_name || "…"}!</h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">Your account is now active and secure.</p>
          <button onClick={() => setShowDashboard(!showDashboard)} className="mt-8 rounded-xl bg-gradient-to-r from-[#4325D6] to-[#5941E8] px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:brightness-110">
            {showDashboard ? "Hide Dashboard" : "Go to Dashboard"}
          </button>
          {showDashboard && <section className="mt-8 rounded-2xl border border-indigo-100 bg-white/90 p-6 text-left shadow-lg">
            <h3 className="text-lg font-bold text-ink">Account dashboard</h3>
            <p className="mt-2 text-sm text-slate-600">Signed in as {user?.email || ""}</p>
            <p className="mt-1 text-sm font-medium text-green-700">Account status: Active and secure</p>
          </section>}
        </div>
      </main>
    </div>
  );
}
