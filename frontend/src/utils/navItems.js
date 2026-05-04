/** @typedef {{ to: string; label: string; icon: string }} NavItem */

/** @type {NavItem[]} */
export const employeeNavItems = [
  { to: "/dashboard", label: "Контролна табла", icon: "home" },
  { to: "/attendance", label: "Евиденција", icon: "idcard" },
  { to: "/leave-requests", label: "Барање за отсуство", icon: "calendar" },
];

/** @type {NavItem[]} */
export const adminNavItems = [
  { to: "/dashboard", label: "Контролна табла", icon: "home" },
  { to: "/attendance", label: "Евиденција", icon: "idcard" },
  { to: "/leave-requests", label: "Барање за отсуство", icon: "calendar" },
  { to: "/employees", label: "Вработени", icon: "users" },
  { to: "/reports", label: "Извештаи", icon: "csv" },
];

/**
 * @param {"admin" | "employee" | null} role
 * @returns {{ primary: NavItem[]; secondary: NavItem[] }}
 */
export function getNavGroups(role) {
  if (role === "EMPLOYEE") {
    return {
      primary: employeeNavItems,
      secondary: [],
    };
  }

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return {
      primary: adminNavItems,
      secondary: [],
    };
  }

  return {
    primary: [],
    secondary: [],
  };
}