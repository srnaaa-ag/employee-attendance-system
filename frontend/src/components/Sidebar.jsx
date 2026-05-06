import {NavLink, useNavigate} from "react-router-dom";
import {getNavGroups} from "../utils/navItems.js";
import {NavIcon, IconLogout} from "./icons/NavIcons.jsx";
import UserAvatar from "./icons/UserAvatar.jsx";
import {clearSession, getRole, getName} from "../services/authService.js";
import "./Sidebar.css";

const linkClass = ({isActive}) =>
    isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";

function roleLabelMk(role) {
    if (role === "EMPLOYEE") return "Вработен";
    if (role === "ADMIN") return "Администратор";
    if (role === "SUPER_ADMIN") return "Супер администратор";
    return role ?? "—";
}

export default function Sidebar() {
    const navigate = useNavigate();

    const role = getRole();
    const profile = {
        name: getName()?.trim() || "Корисник",
        roleKey: role,
        roleLabel: roleLabelMk(role),
    };

    const {primary, secondary} = getNavGroups(profile.roleKey);

    function handleLogout() {
        clearSession();
        navigate("/login");
    }

    return (
        <aside className="sidebar" aria-label="Главна навигација">
            <div className="sidebar__profile">
                <UserAvatar size={80} className="sidebar__avatar"/>
                <p className="sidebar__profile-name">{profile.name}</p>
                <p className="sidebar__profile-role">{profile.roleLabel}</p>
            </div>

            <nav className="sidebar__nav" aria-label="Мени">
                {primary.map((item) => (
                    <NavLink key={item.to} to={item.to} className={linkClass} end={item.end === true}>
            <span className="sidebar__link-inner">
              <NavIcon name={item.icon} size={20} className="sidebar__icon"/>
                {item.label}
            </span>
                    </NavLink>
                ))}

                {secondary.length > 0 ? (
                    <>
                        <div className="sidebar__sep" role="separator"/>
                        {secondary.map((item) => (
                            <NavLink key={item.to} to={item.to} className={linkClass} end={item.end === true}>
                <span className="sidebar__link-inner">
                  <NavIcon name={item.icon} size={20} className="sidebar__icon"/>
                    {item.label}
                </span>
                            </NavLink>
                        ))}
                    </>
                ) : null}

                <div className="sidebar__sep" role="separator"/>

                <button type="button" className="sidebar__logout" onClick={handleLogout}>
                    <IconLogout size={20} className="sidebar__icon"/>
                    Одјави се
                </button>
            </nav>

            <footer className="sidebar__meta">
                <span>Верзија на дизајн 2.0</span>
                <span>Мај 2026</span>
            </footer>
        </aside>
    );
}
