import { useEffect, useMemo, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { DateInput } from "@astryxdesign/core/DateInput";
import type { ISODateString } from "@astryxdesign/core/utils";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Banner } from "@astryxdesign/core/Banner";
import { AppShellLayout } from "../components/AppShellLayout";
import { exportExpenseClaims, listExpenseClaims, type ExpenseClaim } from "../api";

export function ExportPage() {
  const [from, setFrom] = useState<ISODateString | undefined>(undefined);
  const [to, setTo] = useState<ISODateString | undefined>(undefined);
  const [approved, setApproved] = useState<ExpenseClaim[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExpenseClaims({ status: "approved", limit: 100 })
      .then((page) => setApproved(page.data))
      .catch(() => setApproved([]));
  }, []);

  const matchCount = useMemo(() => {
    return approved.filter((c) => {
      if (c.exportedAt) return false;
      if (from && c.claimDate < from) return false;
      if (to && c.claimDate > to) return false;
      return true;
    }).length;
  }, [approved, from, to]);

  async function handleDownload() {
    if (!from || !to) {
      setError("Choose both a from date and a to date.");
      return;
    }
    setIsDownloading(true);
    setError(null);
    try {
      const csv = await exportExpenseClaims(from, to);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-claims-${from}-to-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      // Exported claims are excluded from future exports, per expense-api.
      const page = await listExpenseClaims({ status: "approved", limit: 100 });
      setApproved(page.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <AppShellLayout role="Finance">
      <Heading level={1}>Export to Payroll</Heading>
      {error && <Banner status="error" title={error} />}
      <Card>
        <VStack gap={3}>
          <DateInput label="From date" value={from} onChange={setFrom} />
          <DateInput label="To date" value={to} onChange={setTo} />
          <Text type="body">{matchCount} approved claims match this period</Text>
          <HStack justify="end">
            <Button
              label="Download CSV"
              variant="primary"
              isDisabled={!from || !to}
              isLoading={isDownloading}
              onClick={() => void handleDownload()}
            />
          </HStack>
        </VStack>
      </Card>
    </AppShellLayout>
  );
}
