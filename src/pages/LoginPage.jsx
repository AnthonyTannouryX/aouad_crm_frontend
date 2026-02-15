// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { setToken, decodeJwt } from "../lib/auth";
import "./loginPage.css";

import logo from "../assets/logoblack.png";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return setErr("Email is required");
    if (!cleanEmail.includes("@")) return setErr("Enter a valid email");
    if (!password || password.length < 6)
      return setErr("Password must be at least 6 characters");

    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      const token = res.data?.token;
      if (!token) throw new Error("Missing token in response");

      setToken(token);

      const payload = decodeJwt(token);

      if (payload?.role === "ADMIN") {
        nav("/admin/dashboard", { replace: true });
      } else if (payload?.role === "AGENT") {
        nav("/agent/dashboard", { replace: true });
      } else {
        throw new Error("Unauthorized role");
      }
    } catch (e2) {
      setErr(
        e2?.response?.data?.error ||
          e2?.response?.data?.message ||
          e2?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <Link to="/" className="login-brand" aria-label="Back to website">
          <img src={logo} alt="Aouad" className="login-logo" />
        </Link>

        <div className="login-head">
          <h1 className="login-title">Admin sign in</h1>
          <p className="login-sub">Restricted access.</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="login-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="andrew@aouad.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {err && <div className="login-error">{err}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
