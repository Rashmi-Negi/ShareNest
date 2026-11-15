

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";



import {

  HandHeart,

  User,

  Mail,

  Phone,

  Lock,

  Eye,

  EyeOff,

  CheckCircle2,

  AlertCircle,

  ArrowRight

} from "lucide-react";



import { getSupabaseErrorMessage, supabase } from "../supabaseClient";



function Register() {

  const navigate = useNavigate();



  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim());
  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);



  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  // =====================================

  // FRIENDLY ERROR MESSAGES

  // =====================================



  const getFriendlyError = (message = "") => {

    const msg = message.toLowerCase();



    if (

      msg.includes("already registered") ||

      msg.includes("already exists") ||

      msg.includes("user already registered")

    ) {

      return "An account with this email already exists. Please login instead.";

    }



    if (msg.includes("password should be at least")) {

      return "Your password is too short. Please choose a stronger password.";

    }



    if (msg.includes("invalid email")) {

      return "Please enter a valid email address.";

    }



    if (msg.includes("rate limit") || msg.includes("too many requests")) {

      return "Too many registration attempts. Please wait a little and try again.";

    }



    if (msg.includes("network") || msg.includes("fetch")) {

      return "Unable to connect to ShareNest. Please check your internet connection.";

    }



    return getSupabaseErrorMessage(

      { message },

      "We couldn't create your account. Please check your details and try again."

    );

  };



  // =====================================

  // FORM VALIDATION

  // =====================================



  const validateForm = () => {

    const cleanName = name.trim();

    const cleanEmail = email.trim().toLowerCase();

    const cleanPhone = phone.trim();



    if (cleanName.length < 3) {

      setError("Please enter your full name (at least 3 characters).");

      return false;

    }



    if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {

      setError("Please enter a valid name.");

      return false;

    }



    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(cleanEmail)) {

      setError("Please enter a valid email address.");

      return false;

    }



    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.");

      return false;

    }



    if (password.length < 6) {

      setError("Your password must contain at least 6 characters.");

      return false;

    }



    if (password !== confirmPassword) {

      setError("Your passwords do not match. Please check again.");

      return false;

    }



    return true;

  };



  // =====================================

  // REGISTER ACCOUNT

  // =====================================



  const handleRegister = async (e) => {

    e.preventDefault();



    setError("");

    setSuccess("");



    if (!validateForm()) return;



    setLoading(true);



    try {

      const { data, error: registerError } =

        await supabase.auth.signUp({

          email: email.trim().toLowerCase(),

          password,

          options: {

            data: {

              full_name: name.trim(),

              phone: phone.trim()

            }

          }

        });



      if (registerError) {

        setError(getFriendlyError(registerError.message));

        return;

      }



      if (!data?.user) {
        setError("Registration could not be completed. Please try again.");
        return;
      }

      if (data.session) {

        setSuccess(

          "Your ShareNest account has been created successfully! Welcome to our community."

        );



        setTimeout(() => {

          navigate("/dashboard", { replace: true });

        }, 1800);



      } else {

        setSuccess(

          "Registration successful! Please check your email and verify your account before logging in."

        );



        setTimeout(() => {

          navigate("/login", {

            replace: true,

            state: {

              message: "Your account has been created. Please verify your email and log in."

            }

          });

        }, 2500);

      }



    } catch (err) {

      console.error("Registration error:", err);



      setError(

        "Something went wrong while creating your account. Please try again."

      );



    } finally {

      setLoading(false);

    }

  };



  // =====================================

  // UI

  // =====================================



  return (
    <section className="auth-section register-section sn-register-page">
      <style>{`
        .sn-register-page {
          min-height: calc(100vh - 82px);
          padding: 48px 20px 70px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: radial-gradient(ellipse at 10% 8%, #edf6ec 0%, transparent 45%), #f8faf7;
        }
        .sn-register-page *, .sn-register-page *::before, .sn-register-page *::after { box-sizing: border-box; }
        .sn-register-page .sn-register-card {
          width: min(100%, 540px);
          margin: 0;
          padding: 34px 38px 30px;
          background: #fff;
          border: 1px solid #e2eae2;
          border-radius: 22px;
          box-shadow: 0 18px 55px rgba(33, 69, 42, .065);
          animation: snRegisterRise .45s ease-out both;
        }
        @keyframes snRegisterRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .sn-register-page .sn-register-header { text-align: center; margin-bottom: 27px; }
        .sn-register-page .sn-register-brand {
          width: 52px; height: 52px; margin: 0 auto 15px;
          display: grid; place-items: center; border-radius: 15px;
          background: #eaf4ec; color: #356a43;
        }
        .sn-register-page .sn-register-header h1 { margin: 0 0 8px; color: #233f2d; font-size: 29px; font-weight: 800; letter-spacing: -.7px; }
        .sn-register-page .sn-register-header p { margin: 0; color: #718275; font-size: 13px; line-height: 1.6; }
        .sn-register-page .sn-register-form { display: grid; gap: 16px; }
        .sn-register-page .sn-register-field { min-width: 0; }
        .sn-register-page .sn-register-field label { display: block; margin: 0 0 7px; color: #344c3a; font-size: 12px; font-weight: 700; }
        .sn-register-page .sn-register-input {
          position: relative; display: flex; align-items: center; min-height: 49px;
          border: 1px solid #dce7dd; border-radius: 11px; background: #fbfdfb;
          transition: border-color .2s, box-shadow .2s;
        }
        .sn-register-page .sn-register-input:focus-within { border-color: #6a9a76; box-shadow: 0 0 0 3px rgba(73, 126, 86, .11); }
        .sn-register-page .sn-register-input > svg { position: absolute; left: 15px; color: #779781; pointer-events: none; }
        .sn-register-page .sn-register-input input {
          display: block; width: 100%; height: 49px; margin: 0; padding: 0 15px 0 44px;
          border: 0; outline: none; background: transparent; box-shadow: none;
          color: #253e2c; font: inherit; font-size: 13px;
        }
        .sn-register-page .sn-register-input input::placeholder { color: #9ba99d; }
        .sn-register-page .sn-register-input input:focus { outline: none; border: 0; box-shadow: none; }
        .sn-register-page .sn-register-input.has-toggle input { padding-right: 50px; }
        .sn-register-page .sn-register-toggle {
          position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center; width: 33px; height: 33px; padding: 0;
          border: 0; border-radius: 8px; background: transparent; color: #6b8571; cursor: pointer;
        }
        .sn-register-page .sn-register-toggle:hover { background: #eaf4ec; }
        .sn-register-page .sn-register-hint { margin: 6px 0 0; font-size: 11px; color: #849487; }
        .sn-register-page .sn-register-match { display: flex; align-items: center; gap: 6px; margin: 7px 0 0; font-size: 11px; }
        .sn-register-page .sn-register-match.ok { color: #337548; }
        .sn-register-page .sn-register-match.bad { color: #b65b50; }
        .sn-register-page .sn-register-submit {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; min-height: 49px; margin-top: 5px; padding: 12px 18px;
          border: 0; border-radius: 11px; background: #315f40; color: #fff;
          font: inherit; font-size: 14px; font-weight: 750; cursor: pointer;
          transition: background .2s, transform .2s;
        }
        .sn-register-page .sn-register-submit:hover:not(:disabled) { background: #244e33; transform: translateY(-1px); }
        .sn-register-page .sn-register-submit:disabled { opacity: .7; cursor: not-allowed; }
        .sn-register-page .sn-register-footer { margin: 21px 0 0; text-align: center; color: #77887a; font-size: 13px; }
        .sn-register-page .sn-register-footer a { color: #315f40; font-weight: 750; text-decoration: none; }
        .sn-register-page .sn-register-footer a:hover { text-decoration: underline; }
        .sn-register-page .sn-register-notice { display: flex; gap: 10px; align-items: flex-start; padding: 12px; margin-bottom: 16px; border-radius: 10px; font-size: 12px; line-height: 1.6; }
        .sn-register-page .sn-register-notice svg { flex: 0 0 auto; }
        .sn-register-page .sn-register-notice.error { color: #a33e39; background: #fff1f0; }
        .sn-register-page .sn-register-notice.success { color: #2d7041; background: #eaf7ed; }
        @media (max-width: 580px) {
          .sn-register-page { padding: 24px 13px 45px; }
          .sn-register-page .sn-register-card { padding: 27px 20px; border-radius: 17px; }
          .sn-register-page .sn-register-header h1 { font-size: 25px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sn-register-page .sn-register-card { animation: none; }
          .sn-register-page .sn-register-submit { transition: none; }
        }
      `}</style>

      <div className="sn-register-card">
        <header className="sn-register-header">
          <span className="sn-register-brand"><HandHeart size={28} strokeWidth={1.9} /></span>
          <h1>Create your account</h1>
          <p>Join ShareNest and start making a difference.</p>
        </header>

        {success && (
          <div className="sn-register-notice success" role="status">
            <CheckCircle2 size={18} /> <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="sn-register-notice error" role="alert">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        <form className="sn-register-form" onSubmit={handleRegister}>
          <div className="sn-register-field">
            <label htmlFor="register-name">Full name</label>
            <div className="sn-register-input">
              <User size={18} />
              <input id="register-name" type="text" placeholder="Enter your full name"
                value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
                autoComplete="name" required disabled={loading || !!success} />
            </div>
          </div>

          <div className="sn-register-field">
            <label htmlFor="register-email">Email address</label>
            <div className="sn-register-input">
              <Mail size={18} />
              <input id="register-email" type="email" placeholder="Enter your email"
                value={email} onChange={(e) => { setEmail(e.target.value.replace(/\s/g, "")); setError(""); }}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={emailTouched && !emailValid}
                autoComplete="email" required disabled={loading || !!success} />
            </div>
            {emailTouched && !emailValid && (
              <p className="sn-register-hint" style={{ color: "#b44242" }} role="alert">
                Enter a valid email, for example name@example.com.
              </p>
            )}
          </div>

          <div className="sn-register-field">
            <label htmlFor="register-phone">Phone number</label>
            <div className="sn-register-input">
              <Phone size={18} />
              <input id="register-phone" type="tel" placeholder="10-digit mobile number"
                value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                inputMode="numeric" autoComplete="tel-national" maxLength={10}
                pattern="[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9"
                onBlur={() => setPhoneTouched(true)} aria-invalid={phoneTouched && !phoneValid}
                required disabled={loading || !!success} />
            </div>
            {phoneTouched && !phoneValid && (
              <p className="sn-register-hint" style={{ color: "#b44242" }} role="alert">
                Enter 10 digits, starting with 6, 7, 8 or 9.
              </p>
            )}
          </div>

          <div className="sn-register-field">
            <label htmlFor="register-password">Password</label>
            <div className="sn-register-input has-toggle">
              <Lock size={18} />
              <input id="register-password" type={showPassword ? "text" : "password"}
                placeholder="Create a password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="new-password" minLength={6} required disabled={loading || !!success} />
              <button type="button" className="sn-register-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading || !!success}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="sn-register-hint">At least 6 characters</p>
          </div>

          <div className="sn-register-field">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <div className="sn-register-input has-toggle">
              <Lock size={18} />
              <input id="register-confirm-password" type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                autoComplete="new-password" required disabled={loading || !!success} />
              <button type="button" className="sn-register-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                disabled={loading || !!success}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`sn-register-match ${password === confirmPassword ? "ok" : "bad"}`}>
                {password === confirmPassword ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>

          <button className="sn-register-submit" type="submit" disabled={loading || !!success}>
            {loading ? "Creating account..." : success ? "Account created" : "Create Account"}
            {!loading && !success && <ArrowRight size={17} />}
          </button>
        </form>
        <p className="sn-register-footer">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  );
}

export default Register;
