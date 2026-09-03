import { useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import { assignManager } from "../api";
import { useUsers } from "../hooks/useUsers";

interface EmployeeRow extends Record<string, unknown> {
  id: string;
  employee: string;
  currentManager: string;
  actionLabel: string;
}

export function ManagerAssignmentsPage() {
  const { users, nameOf, isLoading, reload } = useUsers();
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AppShellLayout role="Admin">
        <Heading level={1}>Manager Assignments</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading employees" />
        </Center>
      </AppShellLayout>
    );
  }

  const employees = users.filter((u) => u.role === "Employee");
  const managers = users.filter((u) => u.role === "Manager");

  const rows: EmployeeRow[] = employees.map((u) => ({
    id: u.id,
    employee: u.name,
    currentManager: u.managerId ? nameOf(u.managerId) : "(none)",
    actionLabel: u.managerId ? "Change" : "Assign",
  }));

  const columns: TableColumn<EmployeeRow>[] = [
    { key: "employee", header: "Employee", width: proportional(1) },
    { key: "currentManager", header: "Current Manager", width: proportional(1) },
    {
      key: "actions",
      header: "Actions",
      width: proportional(1),
      renderCell: (row) => (
        <Button
          label={row.actionLabel}
          variant="secondary"
          size="sm"
          onClick={() => {
            setActiveEmployeeId(row.id);
            setManagerId(
              employees.find((e) => e.id === row.id)?.managerId ?? "",
            );
            setError(null);
          }}
        />
      ),
    },
  ];

  async function handleSave() {
    if (!activeEmployeeId || !managerId) {
      setError("Choose a manager.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await assignManager(activeEmployeeId, managerId);
      setActiveEmployeeId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign the manager.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShellLayout role="Admin">
      <Heading level={1}>Manager Assignments</Heading>
      <Card padding={0}>
        <Table data={rows} columns={columns} idKey="id" hasHover />
      </Card>

      <Dialog
        isOpen={activeEmployeeId !== null}
        onOpenChange={(open) => !open && setActiveEmployeeId(null)}
        purpose="form"
        width={420}>
        <Layout
          header={
            <DialogHeader
              title="Assign manager"
              onOpenChange={() => setActiveEmployeeId(null)}
            />
          }
          content={
            <LayoutContent>
              {error && <Banner status="error" title={error} />}
              <Selector
                label="Manager"
                placeholder="Choose a manager"
                options={managers.map((m) => ({ value: m.id, label: m.name }))}
                value={managerId}
                onChange={(value) => setManagerId(value)}
              />
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} justify="end">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onClick={() => setActiveEmployeeId(null)}
                />
                <Button
                  label="Save"
                  variant="primary"
                  isLoading={isSaving}
                  onClick={() => void handleSave()}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </AppShellLayout>
  );
}
