import { useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Switch } from "@astryxdesign/core/Switch";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Banner } from "@astryxdesign/core/Banner";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import { createExpenseCategory, updateExpenseCategory } from "../api";
import { useCategories } from "../hooks/useCategories";

interface CategoryRow extends Record<string, unknown> {
  id: string;
  name: string;
  active: boolean;
}

export function CategoriesPage() {
  const { categories, isLoading, reload } = useCategories();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AppShellLayout role="Admin">
        <Heading level={1}>Expense Categories</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading categories" />
        </Center>
      </AppShellLayout>
    );
  }

  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
  }));

  const columns: TableColumn<CategoryRow>[] = [
    { key: "name", header: "Name", width: proportional(1) },
    {
      key: "active",
      header: "Active",
      width: proportional(1),
      renderCell: (row) => (
        <Switch
          label={row.active ? "Yes" : "No"}
          value={row.active}
          changeAction={async (checked) => {
            await updateExpenseCategory(row.id, { active: checked });
            await reload();
          }}
        />
      ),
    },
  ];

  async function handleAdd() {
    if (!newName.trim()) {
      setError("Enter a category name.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createExpenseCategory(newName.trim());
      setNewName("");
      setIsAddOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the category.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShellLayout role="Admin">
      <Heading level={1}>Expense Categories</Heading>
      <HStack justify="between" align="center">
        <Text type="body" color="secondary">
          Categories employees can choose when submitting a claim
        </Text>
        <Button
          label="Add Category"
          variant="primary"
          onClick={() => {
            setError(null);
            setNewName("");
            setIsAddOpen(true);
          }}
        />
      </HStack>
      <Card padding={0}>
        <Table data={rows} columns={columns} idKey="id" hasHover />
      </Card>

      <Dialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} purpose="form" width={400}>
        <Layout
          header={<DialogHeader title="Add Category" onOpenChange={() => setIsAddOpen(false)} />}
          content={
            <LayoutContent>
              {error && <Banner status="error" title={error} />}
              <TextInput label="Name" value={newName} onChange={setNewName} />
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} justify="end">
                <Button
                  label="Cancel"
                  variant="secondary"
                  onClick={() => setIsAddOpen(false)}
                />
                <Button
                  label="Add Category"
                  variant="primary"
                  isLoading={isSaving}
                  onClick={() => void handleAdd()}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </AppShellLayout>
  );
}
