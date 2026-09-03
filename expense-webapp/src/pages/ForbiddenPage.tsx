import { Center } from "@astryxdesign/core/Center";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Button } from "@astryxdesign/core/Button";
import { signOut } from "../auth";

export function ForbiddenPage() {
  return (
    <Center height="100vh">
      <EmptyState
        title="No role assigned"
        description="Your account is not yet assigned an Employee, Manager, Finance, or Admin role in Expense Claims. Ask an admin to grant you access."
        actions={<Button label="Sign out" variant="secondary" onClick={() => signOut()} />}
      />
    </Center>
  );
}
