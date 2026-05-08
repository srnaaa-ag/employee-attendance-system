import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEyeOff, IconLock, IconUserCircle } from "../components/icons/NavIcons.jsx";
import UserAvatar from "../components/icons/UserAvatar.jsx";
import { setRole, setToken, setName } from "../services/authService.js";
import { login } from "../services/api.js";
import { clearProfileCache } from "../services/profileService.js";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      clearProfileCache();
      setToken(data.token);
      setRole(data.role);
      setName(data.fullName);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
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
        </div>
      </div>
    </div>
  );
}