// Roles this app serves, per specs/design/security.json. The SPA reads a
// role only for presentation (which screens/nav to show) — expense-api is
// the one authority that enforces permission and answers 403.
export type Role = "Employee" | "Manager" | "Finance" | "Admin";

// Checked in this order so a caller in several groups resolves to the
// highest-privilege one; matched as a case-insensitive substring so the
// match survives the org renaming its groups (per thunder-authentication).
const ROLE_KEYWORDS: Role[] = ["Admin", "Finance", "Manager", "Employee"];

export function resolveRole(groups: string[]): Role | null {
  for (const role of ROLE_KEYWORDS) {
    if (groups.some((g) => g.toLowerCase().includes(role.toLowerCase()))) {
      return role;
    }
  }
  return null;
}

// The screens (routes) each role may reach, per security.json permissions.
export const ROLE_HOME: Record<Role, string> = {
  Employee: "/my-claims",
  Manager: "/approvals",
  Finance: "/approved-claims",
  Admin: "/managers",
};
