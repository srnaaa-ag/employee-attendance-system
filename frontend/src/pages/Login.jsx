import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEyeOff, IconLock, IconUserCircle } from "../components/icons/NavIcons.jsx";
import UserAvatar from "../components/icons/UserAvatar.jsx";
import { setRole, setToken, setName } from "../services/authService.js";
import { login, verifyTwoFactor } from "../services/api.js";
import { clearProfileCache } from "../services/profileService.js";
import "./Login.css";

function completeSession(data, navigate) {
  clearProfileCache();
  setToken(data.token);
  setRole(data.role);
  setName(data.fullName);
  navigate("/dashboard", { replace: true });
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [twoFaStep, setTwoFaStep] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [otpCode, setOtpCode] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      if (data.requires2fa) {
        setPendingToken(data.pendingToken);
        setMaskedEmail(data.maskedEmail || data.maskedPhone || "");
        setOtpHint(data.otpHint || "");
        setTwoFaStep(true);
        setOtpCode("");
        return;
      }

      completeSession(data, navigate);
    } catch (err) {
      setError(err?.message || "Погрешен email или лозинка.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyTwoFactor(pendingToken, otpCode.trim());
      completeSession(data, navigate);
    } catch (err) {
      setError(err?.message || "Невалиден код.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin() {
    setTwoFaStep(false);
    setPendingToken("");
    setMaskedEmail("");
    setOtpHint("");
    setOtpCode("");
    setError("");
  }

  return (
    <div className="login">
      <div className="login__art" aria-hidden="true" />

      <div className="login__right">
        <div className="login__body">
          <UserAvatar size={96} className="login__hero-avatar" />
          <h1 className="login__title">
            АВТОМАТИЗИРАНА ЕВИДЕНЦИЈА НА ПРИСУСТВО НА ВРАБОТЕНИ
          </h1>

          {!twoFaStep ? (
            <form className="login__form" onSubmit={handleSubmit}>
              <div className="login__field">
                <IconUserCircle size={22} className="login__field-icon" aria-hidden />
                <input
                    className="login__input"
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    aria-label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="login__field">
                <IconLock size={22} className="login__field-icon" aria-hidden />
                <input
                    className="login__input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    aria-label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="button"
                    className="login__password-toggle"
                    aria-label={showPassword ? "Сокриј лозинка" : "Прикажи лозинка"}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                      <IconEyeOff size={20} aria-hidden />
                  ) : (
                      <IconEye size={20} aria-hidden />
                  )}
                </button>
              </div>

              {error && <p className="login__error">{error}</p>}

              <div className="login__row">
                <a href="#" className="login__forgot" onClick={(e) => e.preventDefault()}>
                  Заборавена лозинка?
                </a>
                <button type="submit" className="login__submit" disabled={loading}>
                  {loading ? "Најавување..." : "Најави се"}
                </button>
              </div>
            </form>
          ) : (
            <form className="login__form" onSubmit={handleVerifyOtp}>
              <p className="login__2fa-hint">
                Код за најава за <strong>{maskedEmail || email || "вашата адреса"}</strong>.
                {otpHint ? (
                    <>
                      <br />
                      <span className="login__2fa-dev">{otpHint}</span>
                    </>
                ) : (
                    <> Проверете го email (и Spam) и внесете го кодот.</>
                )}
              </p>
              <div className="login__field">
                <IconLock size={22} className="login__field-icon" aria-hidden />
                <input
                    className="login__input login__input--otp"
                    type="text"
                    name="otp"
                    placeholder="Код од email"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Код од email"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                />
              </div>

              {error && <p className="login__error">{error}</p>}

              <div className="login__row login__row--2fa">
                <button
                    type="button"
                    className="login__forgot login__back-btn"
                    onClick={handleBackToLogin}
                    disabled={loading}
                >
                  Назад
                </button>
                <button
                    type="submit"
                    className="login__submit"
                    disabled={loading || otpCode.length < 4}
                >
                  {loading ? "Проверувам..." : "Потврди код"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
