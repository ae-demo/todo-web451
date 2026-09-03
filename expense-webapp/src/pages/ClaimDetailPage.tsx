import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import { StatusBadge } from "../components/StatusBadge";
import { getExpenseClaim, type ExpenseClaim } from "../api";
import { useCategories } from "../hooks/useCategories";

export function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { nameOf, isLoading: categoriesLoading } = useCategories();
  const [claim, setClaim] = useState<ExpenseClaim | null>(null);

  useEffect(() => {
    if (!claimId) return;
    getExpenseClaim(claimId).then(setClaim);
  }, [claimId]);

  if (claim === null || categoriesLoading) {
    return (
      <AppShellLayout role="Employee">
        <Heading level={1}>Claim Detail</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading claim" />
        </Center>
      </AppShellLayout>
    );
  }

  return (
    <AppShellLayout role="Employee">
      <Heading level={1}>Claim Detail</Heading>
      <Card>
        <VStack gap={3}>
          <StatusBadge status={claim.status} />
          <Text type="body">Category: {nameOf(claim.categoryId)}</Text>
          <Text type="body">Amount: {claim.amount.toFixed(2)}</Text>
          <Text type="body">Date: {claim.claimDate}</Text>
          <Text type="body">Description: {claim.description}</Text>
          {claim.status === "rejected" && claim.managerComment && (
            <Card variant="muted">
              <VStack gap={1}>
                <Text type="label">Manager Comment</Text>
                <Text type="body">{claim.managerComment}</Text>
              </VStack>
            </Card>
          )}
          {claim.status === "rejected" && (
            <HStack justify="end">
              <Button
                label="Edit & Resubmit"
                variant="primary"
                onClick={() => navigate(`/submit-claim?claimId=${claim.id}`)}
              />
            </HStack>
          )}
        </VStack>
      </Card>
    </AppShellLayout>
  );
}
