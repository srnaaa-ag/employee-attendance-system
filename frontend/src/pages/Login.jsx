import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconLock, IconUserCircle } from "../components/icons/NavIcons.jsx";
import UserAvatar from "../components/icons/UserAvatar.jsx";
import { setRole, setToken } from "../services/authService.js";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [access, setAccess] = useState("employee");

  function handleSubmit(e) {
    e.preventDefault();
    setRole(access);
    setToken("demo");
    navigate("/dashboard", { replace: true });
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
            className={
              access === "employee" ? "login__tab login__tab--active" : "login__tab login__tab--inactive"
            }
            onClick={() => setAccess("employee")}
          >
            Вработен
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={access === "admin"}
            className={
              access === "admin" ? "login__tab login__tab--active" : "login__tab login__tab--inactive"
            }
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
              />
            </div>

            <div className="login__row">
              <a href="#" className="login__forgot" onClick={(e) => e.preventDefault()}>
                Заборавена лозинка?
              </a>
              <button type="submit" className="login__submit">
                Најави се
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
