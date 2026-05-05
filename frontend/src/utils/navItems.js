/** @typedef {{ to: string; label: string; icon: string; end?: boolean }} NavItem */

/** @type {NavItem[]} */
export const employeeNavItems = [
  { to: "/dashboard", label: "Контролна табла", icon: "home", end: true },
  { to: "/attendance", label: "Евиденција", icon: "idcard", end: true },
  { to: "/leave-requests", label: "Барање за отсуство", icon: "calendar", end: true },
];

/** @type {NavItem[]} */
export const adminNavItems = [
  { to: "/dashboard", label: "Контролна табла", icon: "home", end: true },
  { to: "/attendance", label: "Евиденција", icon: "idcard", end: true },
  { to: "/leave-requests", label: "Барање за отсуство", icon: "calendar", end: true },
  { to: "/employees", label: "Вработени", icon: "users", end: true },
  { to: "/reports", label: "Извештаи", icon: "csv", end: true },
];

const profileNavItem = { to: "/profile", label: "Профил", icon: "user", end: true };

/**
 * @param {"EMPLOYEE" | "ADMIN" | "SUPER_ADMIN" | null | undefined} role
 * @returns {{ primary: NavItem[]; secondary: NavItem[] }}
 */
export function getNavGroups(role) {
  const effectiveRole = role ?? "EMPLOYEE";

  if (effectiveRole === "EMPLOYEE") {
    return {
      primary: employeeNavItems,
      secondary: [profileNavItem],
    };
  }

  if (effectiveRole === "ADMIN" || effectiveRole === "SUPER_ADMIN") {
    return {
      primary: adminNavItems,
      secondary: [profileNavItem],
    };
  }

  return {
    primary: employeeNavItems,
    secondary: [profileNavItem],
  };
}
