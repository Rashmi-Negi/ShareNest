import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HandHeart,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseErrorMessage, supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        setError(getSupabaseErrorMessage(loginError, loginError.message));
        return;
      }

      const destination = typeof location.state?.from === "string" &&
        ["/dashboard", "/donations", "/add-donation", "/notifications"].includes(location.state.from)
          ? location.state.from
          : "/dashboard";
      navigate(destination, { replace: true });
    } catch (loginError) {
      console.error("Login error:", loginError);
      setError(getSupabaseErrorMessage(loginError, "Unable to log in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="sn-login-page">
      <style>{`
        @keyframes sn-login-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sn-login-page,
        .sn-login-page * { box-sizing: border-box; }

        .sn-login-page {
          min-height: calc(100vh - 90px);
          display: grid;
          place-items: center;
          padding: 48px 20px;
          background:
            radial-gradient(circle at 15% 12%, rgba(211, 232, 212, 0.46), transparent 33%),
            radial-gradient(circle at 90% 88%, rgba(220, 235, 218, 0.40), transparent 32%),
            #f8faf7;
          font-family: inherit;
        }

        .sn-login-card {
          width: 100%;
          max-width: 460px;
          padding: clamp(28px, 4vw, 43px);
          border: 1px solid #e3ebe2;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 22px 65px rgba(29, 66, 39, 0.07);
          animation: sn-login-rise 0.45s ease both;
        }

        .sn-login-brand {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          margin-bottom: 24px;
          border-radius: 16px;
          background: #eaf3e9;
          color: #315f40;
        }

        .sn-login-card h1 {
          margin: 0 0 9px;
          color: #203d2a;
          font-size: clamp(26px, 3vw, 32px);
          font-weight: 750;
          letter-spacing: -0.9px;
          line-height: 1.2;
        }

        .sn-login-subtitle {
          margin: 0 0 30px;
          color: #78877b;
          font-size: 14px;
          line-height: 1.6;
        }

        .sn-login-form { display: grid; gap: 18px; }

        .sn-login-field { display: grid; gap: 9px; }

        .sn-login-field label {
          color: #354f3b;
          font-size: 13px;
          font-weight: 700;
        }

        .sn-login-input-wrap { position: relative; }

        .sn-login-input-icon {
          position: absolute;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          color: #7d9983;
          pointer-events: none;
        }

        .sn-login-page .sn-login-input {
          display: block;
          width: 100%;
          height: 52px;
          margin: 0;
          padding: 0 46px;
          border: 1px solid #dde7de;
          border-radius: 12px;
          outline: none;
          background: #f9fbf9;
          color: #243d2c;
          font: inherit;
          font-size: 14px;
          box-shadow: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sn-login-page .sn-login-input::placeholder { color: #9aa79c; }

        .sn-login-page .sn-login-input:focus {
          border-color: #7aab84;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(77, 131, 88, 0.10);
        }

        .sn-login-eye {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #6e8a75;
          cursor: pointer;
        }

        .sn-login-eye:hover { background: #edf4ee; }

        .sn-login-error,
        .sn-login-message {
          margin: 0;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }

        .sn-login-error {
          border: 1px solid #f1d3d0;
          background: #fff6f5;
          color: #a13b35;
        }

        .sn-login-message {
          margin-bottom: 20px;
          border: 1px solid #d6e7d9;
          background: #f0f8f0;
          color: #366f43;
        }

        .sn-login-page .sn-login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 52px;
          margin-top: 5px;
          padding: 12px 18px;
          border: 1px solid #315f40;
          border-radius: 12px;
          background: #315f40;
          color: #ffffff;
          font: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .sn-login-page .sn-login-submit:hover:not(:disabled) {
          background: #264d33;
          transform: translateY(-1px);
        }

        .sn-login-page .sn-login-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .sn-login-footer {
          margin: 25px 0 0;
          color: #78877b;
          text-align: center;
          font-size: 13px;
        }

        .sn-login-footer a {
          color: #315f40;
          font-weight: 750;
          text-decoration: none;
        }

        .sn-login-footer a:hover { text-decoration: underline; }

        .sn-login-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 23px;
          color: #93a296;
          font-size: 11px;
        }

        @media (max-width: 520px) {
          .sn-login-page { padding: 24px 14px; }
          .sn-login-card { border-radius: 19px; padding: 27px 22px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sn-login-card { animation: none; }
          .sn-login-page .sn-login-submit { transition: none; }
        }
      `}</style>

      <div className="sn-login-card">
        <div className="sn-login-brand" aria-hidden="true">
          <HandHeart size={29} strokeWidth={1.8} />
        </div>

        <h1>Welcome back</h1>
        <p className="sn-login-subtitle">
          Sign in to continue your journey with ShareNest.
        </p>

        {location.state?.message && (
          <p className="sn-login-message" role="status">
            {location.state.message}
          </p>
        )}

        <form className="sn-login-form" onSubmit={handleLogin}>
          <div className="sn-login-field">
            <label htmlFor="sn-login-email">Email address</label>
            <div className="sn-login-input-wrap">
              <Mail className="sn-login-input-icon" size={18} aria-hidden="true" />
              <input
                id="sn-login-email"
                className="sn-login-input"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="sn-login-field">
            <label htmlFor="sn-login-password">Password</label>
            <div className="sn-login-input-wrap">
              <LockKeyhole className="sn-login-input-icon" size={18} aria-hidden="true" />
              <input
                id="sn-login-password"
                className="sn-login-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="sn-login-eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="sn-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="sn-login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="sn-login-footer">
          New to ShareNest? <Link to="/register">Create an account</Link>
        </p>

        <div className="sn-login-trust">
          <ShieldCheck size={14} aria-hidden="true" />
          Secure sign-in
        </div>
      </div>
    </section>
  );
}

export default Login;
