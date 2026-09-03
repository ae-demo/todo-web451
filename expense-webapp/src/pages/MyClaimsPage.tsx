import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { Button } from "@astryxdesign/core/Button";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Link } from "@astryxdesign/core/Link";
import { AppShellLayout } from "../components/AppShellLayout";
import { StatusBadge } from "../components/StatusBadge";
import { listExpenseClaims, type ExpenseClaim } from "../api";
import { useCategories } from "../hooks/useCategories";

interface ClaimRow extends Record<string, unknown> {
  id: string;
  date: string;
  category: string;
  amount: string;
  status: string;
}

export function MyClaimsPage() {
  const navigate = useNavigate();
  const { nameOf, isLoading: categoriesLoading } = useCategories();
  const [claims, setClaims] = useState<ExpenseClaim[] | null>(null);

  useEffect(() => {
    listExpenseClaims({ limit: 100 })
      .then((page) => setClaims(page.data))
      .catch(() => setClaims([]));
  }, []);

  const isLoading = claims === null || categoriesLoading;

  const rows: ClaimRow[] = (claims ?? []).map((c) => ({
    id: c.id,
    date: c.claimDate,
    category: nameOf(c.categoryId),
    amount: c.amount.toFixed(2),
    status: c.status,
  }));

  const columns: TableColumn<ClaimRow>[] = [
    {
      key: "date",
      header: "Date",
      width: proportional(1),
      renderCell: (row) => (
        <Link href={`/claims/${row.id}`} isStandalone>
          {row.date}
        </Link>
      ),
    },
    { key: "category", header: "Category", width: proportional(1) },
    { key: "amount", header: "Amount", width: proportional(1) },
    {
      key: "status",
      header: "Status",
      width: proportional(1),
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <AppShellLayout role="Employee">
      <Heading level={1}>My Claims</Heading>
      <HStack justify="between" align="center">
        <Text type="body" color="secondary">
          Track every claim you&apos;ve submitted
        </Text>
        <Button
          label="Submit Claim"
          variant="primary"
          onClick={() => navigate("/submit-claim")}
        />
      </HStack>
      {isLoading ? (
        <Center height={200}>
          <Spinner size="lg" label="Loading claims" />
        </Center>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No claims yet"
          description="Submit your first expense claim to see it here."
          actions={
            <Button
              label="Submit Claim"
              variant="primary"
              onClick={() => navigate("/submit-claim")}
            />
          }
        />
      ) : (
        <Card padding={0}>
          <Table data={rows} columns={columns} idKey="id" hasHover />
        </Card>
      )}
    </AppShellLayout>
  );
}
