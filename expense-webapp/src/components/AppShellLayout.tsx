import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppShell } from "@astryxdesign/core/AppShell";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import type { Role } from "../roles";
import { signOut } from "../auth";

type NavItem = { label: string; href: string };

// Mirrors each role's navbar line in wireframes.dsl exactly — same labels,
// same destinations, same "Expense Claims" app heading.
const NAV_ITEMS: Record<Role, NavItem[]> = {
  Employee: [
    { label: "My Claims", href: "/my-claims" },
    { label: "Submit Claim", href: "/submit-claim" },
  ],
  Manager: [{ label: "Approvals", href: "/approvals" }],
  Finance: [
    { label: "Approved Claims", href: "/approved-claims" },
    { label: "Export", href: "/export" },
  ],
  Admin: [
    { label: "Managers", href: "/managers" },
    { label: "Categories", href: "/categories" },
  ],
};

export function AppShellLayout({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const location = useLocation();

  return (
    <AppShell
      contentPadding={6}
      topNav={
        <TopNav
          label="Main navigation"
          heading={<TopNavHeading heading="Expense Claims" headingHref="/" />}
          startContent={
            <>
              {NAV_ITEMS[role].map((item) => (
                <TopNavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isSelected={location.pathname.startsWith(item.href)}
                />
              ))}
            </>
          }
          endContent={
            <Button label="Sign out" variant="ghost" onClick={() => signOut()} />
          }
        />
      }>
      <VStack gap={4}>{children}</VStack>
    </AppShell>
  );
}
