import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getNavGroups } from "../utils/navItems.js";
import { NavIcon, IconLogout, IconClose } from "./icons/NavIcons.jsx";
import UserAvatar from "./icons/UserAvatar.jsx";
import { clearSession, getRole, getName } from "../services/authService.js";
import { clearProfileCache } from "../services/profileService.js";
import { useMatchMedia } from "../hooks/useMatchMedia.js";
import "./Sidebar.css";

const linkClass = ({ isActive }) =>
    isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";

function roleLabelMk(role) {
    if (role === "EMPLOYEE") return "Вработен";
    if (role === "ADMIN") return "Администратор";
    if (role === "SUPER_ADMIN") return "Супер администратор";
    return role ?? "—";
}

/**
 * @param {{ mobileOpen?: boolean; onMobileClose?: () => void }} props
 */
export default function Sidebar({ mobileOpen = false, onMobileClose }) {
    const navigate = useNavigate();
    const isMobileNav = useMatchMedia("(max-width: 768px)");

    const role = getRole();
    const profile = {
        name: getName()?.trim() || "Корисник",
        roleKey: role,
        roleLabel: roleLabelMk(role),
    };

    const { primary, secondary } = getNavGroups(profile.roleKey);

    useEffect(() => {
        if (!isMobileNav || !mobileOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                onMobileClose?.();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isMobileNav, mobileOpen, onMobileClose]);

    useEffect(() => {
        if (!isMobileNav) {
            onMobileClose?.();
        }
    }, [isMobileNav, onMobileClose]);

    useEffect(() => {
        if (!isMobileNav || !mobileOpen) return;

        const html = document.documentElement;
        const body = document.body;
        const scrollY = window.scrollY;

        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevBodyPosition = body.style.position;
        const prevBodyTop = body.style.top;
        const prevBodyLeft = body.style.left;
        const prevBodyRight = body.style.right;
        const prevBodyWidth = body.style.width;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            body.style.position = prevBodyPosition;
            body.style.top = prevBodyTop;
            body.style.left = prevBodyLeft;
            body.style.right = prevBodyRight;
            body.style.width = prevBodyWidth;
            window.scrollTo(0, scrollY);
        };
    }, [isMobileNav, mobileOpen]);

    function handleLogout() {
        clearProfileCache();
        clearSession();
        onMobileClose?.();
        navigate("/login");
    }

    function closeDrawer() {
        onMobileClose?.();
    }

    function renderNavLink(item) {
        return (
            <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                end={item.end === true}
                onClick={() => {
                    if (isMobileNav) closeDrawer();
                }}
            >
                <span className="sidebar__link-inner">
                    <NavIcon name={item.icon} size={20} className="sidebar__icon"/>
                    {item.label}
                </span>
            </NavLink>
        );
    }

    return (
        <>
            <div
                className={
                    "sidebar__backdrop" +
                    (isMobileNav && mobileOpen ? " sidebar__backdrop--visible" : "")
                }
                onClick={closeDrawer}
                aria-hidden="true"
            />

            <aside
                className={
                    "sidebar" +
                    (isMobileNav ? " sidebar--mobile" : "") +
                    (isMobileNav && mobileOpen ? " sidebar--mobile-open" : "")
                }
                aria-label="Главна навигација"
                aria-hidden={isMobileNav && !mobileOpen ? true : undefined}
            >
                {isMobileNav ? (
                    <div className="sidebar__mobile-head">
                        <span className="sidebar__mobile-title">Мени</span>
                        <button
                            type="button"
                            className="sidebar__mobile-close"
                            onClick={closeDrawer}
                            aria-label="Затвори мени"
                        >
                            <IconClose size={22}/>
                        </button>
                    </div>
                ) : null}

                <div className="sidebar__profile">
                    <UserAvatar
                        size={isMobileNav ? 64 : 80}
                        className="sidebar__avatar"
                    />
                    <p className="sidebar__profile-name">{profile.name}</p>
                    <p className="sidebar__profile-role">{profile.roleLabel}</p>
                </div>

                <nav id="app-sidebar-nav" className="sidebar__nav" aria-label="Мени ставки">
                    {primary.map((item) => renderNavLink(item))}

                    {secondary.length > 0 ? (
                        isMobileNav ? (
                            <details className="sidebar__accordion" open>
                                <summary className="sidebar__accordion-summary">
                                    Профил и поставки
                                </summary>
                                <div className="sidebar__accordion-panel">
                                    {secondary.map((item) => renderNavLink(item))}
                                </div>
                            </details>
                        ) : (
                            <>
                                <div className="sidebar__sep" role="separator"/>
                                {secondary.map((item) => renderNavLink(item))}
                            </>
                        )
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
        </>
    );
}
