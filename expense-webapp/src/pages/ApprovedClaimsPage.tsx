import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import { listExpenseClaims, type ExpenseClaim } from "../api";
import { useCategories } from "../hooks/useCategories";
import { useUsers } from "../hooks/useUsers";

interface ApprovedRow extends Record<string, unknown> {
  id: string;
  employee: string;
  date: string;
  category: string;
  amount: string;
  exported: string;
}

export function ApprovedClaimsPage() {
  const navigate = useNavigate();
  const { nameOf: categoryNameOf, isLoading: categoriesLoading } = useCategories();
  const { nameOf: userNameOf, isLoading: usersLoading } = useUsers();
  const [claims, setClaims] = useState<ExpenseClaim[] | null>(null);

  useEffect(() => {
    listExpenseClaims({ status: "approved", limit: 100 })
      .then((page) => setClaims(page.data))
      .catch(() => setClaims([]));
  }, []);

  if (claims === null || categoriesLoading || usersLoading) {
    return (
      <AppShellLayout role="Finance">
        <Heading level={1}>Approved Claims</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading approved claims" />
        </Center>
      </AppShellLayout>
    );
  }

  const rows: ApprovedRow[] = claims.map((c) => ({
    id: c.id,
    employee: userNameOf(c.employeeId),
    date: c.claimDate,
    category: categoryNameOf(c.categoryId),
    amount: c.amount.toFixed(2),
    exported: c.exportedAt ? "Yes" : "No",
  }));

  const columns: TableColumn<ApprovedRow>[] = [
    { key: "employee", header: "Employee", width: proportional(1) },
    { key: "date", header: "Date", width: proportional(1) },
    { key: "category", header: "Category", width: proportional(1) },
    { key: "amount", header: "Amount", width: proportional(1) },
    { key: "exported", header: "Exported", width: proportional(1) },
  ];

  return (
    <AppShellLayout role="Finance">
      <Heading level={1}>Approved Claims</Heading>
      {rows.length === 0 ? (
        <EmptyState
          title="No approved claims yet"
          description="Claims approved by managers will appear here."
        />
      ) : (
        <Card padding={0}>
          <Table data={rows} columns={columns} idKey="id" hasHover />
        </Card>
      )}
      <HStack justify="end">
        <Button label="Export" variant="primary" onClick={() => navigate("/export")} />
      </HStack>
    </AppShellLayout>
  );
}
