import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";

import { currentUser, signIn } from "./auth";
import { resolveRole, ROLE_HOME, type Role } from "./roles";

import { CallbackPage } from "./pages/CallbackPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { MyClaimsPage } from "./pages/MyClaimsPage";
import { SubmitClaimPage } from "./pages/SubmitClaimPage";
import { ClaimDetailPage } from "./pages/ClaimDetailPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { ApprovalDetailPage } from "./pages/ApprovalDetailPage";
import { ApprovedClaimsPage } from "./pages/ApprovedClaimsPage";
import { ExportPage } from "./pages/ExportPage";
import { ManagerAssignmentsPage } from "./pages/ManagerAssignmentsPage";
import { CategoriesPage } from "./pages/CategoriesPage";

function FullPageSpinner() {
  return (
    <Center height="100vh">
      <Spinner size="lg" label="Loading" />
    </Center>
  );
}

// Every screen this role may reach, per specs/design/security.json. A route
// outside this list redirects to the role's home screen — presentation only;
// expense-api is the authority that enforces permission and answers 403.
function RoleRoutes({ role }: { role: Role }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROLE_HOME[role]} replace />} />
      {role === "Employee" && (
        <>
          <Route path="/my-claims" element={<MyClaimsPage />} />
          <Route path="/submit-claim" element={<SubmitClaimPage />} />
          <Route path="/claims/:claimId" element={<ClaimDetailPage />} />
        </>
      )}
      {role === "Manager" && (
        <>
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/:claimId" element={<ApprovalDetailPage />} />
        </>
      )}
      {role === "Finance" && (
        <>
          <Route path="/approved-claims" element={<ApprovedClaimsPage />} />
          <Route path="/export" element={<ExportPage />} />
        </>
      )}
      {role === "Admin" && (
        <>
          <Route path="/managers" element={<ManagerAssignmentsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </>
      )}
      <Route path="*" element={<Navigate to={ROLE_HOME[role]} replace />} />
    </Routes>
  );
}

// An unauthenticated visitor is redirected to Thunder sign-in before any
// claim data (or even the shell) is reachable — the OIDC + PKCE gate.
function AuthGate() {
  const [role, setRole] = useState<Role | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    currentUser().then((user) => {
      if (cancelled) return;
      if (!user) {
        void signIn();
        return;
      }
      const groups = Array.isArray(user.profile?.groups)
        ? (user.profile.groups as string[])
        : [];
      setRole(resolveRole(groups));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (role === "loading") return <FullPageSpinner />;
  if (role === null) return <ForbiddenPage />;
  return <RoleRoutes role={role} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/*" element={<AuthGate />} />
    </Routes>
  );
}
