// ============================================================
//  LoginPage  –  Auth feature
// ============================================================

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../core/services/AuthService";
import { useToast } from "../../shared/hooks";
import styles from "./LoginPage.module.css";
import lettuceLogo from "../../../assets/lettuce.jpg";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authService.signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    navigate(from, { replace: true });
  }

  return (
    <div className={styles.container} data-testid="login-page">
      {/* ── Illustration panel ── */}
      <div className={styles.illustration} aria-hidden>
        <div className={styles.logoWrap} id="loginLogoWrap">
          {/* Decorative dots */}
          <span className={styles.dot} style={{ top: "8%", left: "10%" }} />
          <span className={styles.dot} style={{ top: "28%", left: "6%" }} />
          <span className={styles.dot} style={{ top: "52%", left: "12%" }} />
          <span className={styles.dot} style={{ top: "72%", right: "8%" }} />

          {/* Logo card with badge */}
          <div className={styles.logoCard}>
            <div className={styles.badge}>Fresh D.</div>
            <img
              src={lettuceLogo}
              alt="Lettuce Logo"
              className={styles.logoEmoji}
            />
          </div>

          {/* Stars */}
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <span key={i} className={styles.star}>
                ★
              </span>
            ))}
          </div>

          {/* Brand title */}
          <h2 className={styles.brandTitle}>AG Lettuce Be Fresh</h2>

          {/* Tagline */}
          <p className={styles.tagline}>
            Farm-fresh inventory management,{" "}
            <span className={styles.taglineAccent}>powered by Wave</span>
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className={styles.formWrapper}>
        <div className={styles.card}>
          <div className={styles.logoArea}>
            <i
              className="fa-solid fa-leaf"
              style={{ fontSize: 48, color: "var(--green-600)" }}
            />
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div
              className={styles.error}
              role="alert"
              data-testid="login-error"
            >
              <i className="fa-solid fa-triangle-exclamation" /> {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-testid="login-form"
          >
            <div className={styles.formGroup}>
              <label htmlFor="loginEmail">Email</label>
              <div className={styles.inputWrapper}>
                <i className={`fa-solid fa-envelope ${styles.inputIcon}`} />
                <input
                  id="loginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoFocus
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="loginPassword">Password</label>
              <div className={styles.inputWrapper}>
                <i className={`fa-solid fa-lock ${styles.inputIcon}`} />
                <input
                  id="loginPassword"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  className={styles.togglePass}
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  data-testid="toggle-password"
                >
                  <i
                    className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? (
                <>
                  <span className={styles.spinner} /> Signing in…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket" /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
