import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import { listExpenseClaims, type ExpenseClaim } from "../api";
import { useCategories } from "../hooks/useCategories";
import { useUsers } from "../hooks/useUsers";

interface ApprovalRow extends Record<string, unknown> {
  id: string;
  employee: string;
  date: string;
  category: string;
  amount: string;
}

export function ApprovalsPage() {
  const navigate = useNavigate();
  const { nameOf: categoryNameOf, isLoading: categoriesLoading } = useCategories();
  const { nameOf: userNameOf, isLoading: usersLoading } = useUsers();
  const [claims, setClaims] = useState<ExpenseClaim[] | null>(null);

  useEffect(() => {
    listExpenseClaims({ status: "submitted", limit: 100 })
      .then((page) => setClaims(page.data))
      .catch(() => setClaims([]));
  }, []);

  if (claims === null || categoriesLoading || usersLoading) {
    return (
      <AppShellLayout role="Manager">
        <Heading level={1}>Pending Approvals</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading approvals" />
        </Center>
      </AppShellLayout>
    );
  }

  const rows: ApprovalRow[] = claims.map((c) => ({
    id: c.id,
    employee: userNameOf(c.employeeId),
    date: c.claimDate,
    category: categoryNameOf(c.categoryId),
    amount: c.amount.toFixed(2),
  }));

  const columns: TableColumn<ApprovalRow>[] = [
    { key: "employee", header: "Employee", width: proportional(1) },
    { key: "date", header: "Date", width: proportional(1) },
    { key: "category", header: "Category", width: proportional(1) },
    { key: "amount", header: "Amount", width: proportional(1) },
    {
      key: "actions",
      header: "Actions",
      width: proportional(1),
      renderCell: (row) => (
        <Button
          label="Review"
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/approvals/${row.id}`)}
        />
      ),
    },
  ];

  return (
    <AppShellLayout role="Manager">
      <Heading level={1}>Pending Approvals</Heading>
      {rows.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="Claims submitted by your direct reports will appear here."
        />
      ) : (
        <Card padding={0}>
          <Table data={rows} columns={columns} idKey="id" hasHover />
        </Card>
      )}
    </AppShellLayout>
  );
}
