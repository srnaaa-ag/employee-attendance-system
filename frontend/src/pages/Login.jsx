import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { IconLock, IconUserCircle } from "../components/icons/NavIcons.jsx";
import UserAvatar from "../components/icons/UserAvatar.jsx";
import { isAuthenticated, setRole, setToken, setName } from "../services/authService.js";
import { login } from "../services/api.js";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [access, setAccess] = useState("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
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
        <div className="login__tabs" role="tablist" aria-label="Тип на корисник">
          <button
            type="button"
            role="tab"
            aria-selected={access === "employee"}
            className={access === "employee" ? "login__tab login__tab--active" : "login__tab login__tab--inactive"}
            onClick={() => setAccess("employee")}
          >
            Вработен
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={access === "admin"}
            className={access === "admin" ? "login__tab login__tab--active" : "login__tab login__tab--inactive"}
            onClick={() => setAccess("admin")}
          >
            Администратор
          </button>
        </div>

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
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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