import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AppShellLayout } from "../components/AppShellLayout";
import {
  approveExpenseClaim,
  getExpenseClaim,
  rejectExpenseClaim,
  type ExpenseClaim,
} from "../api";
import { useCategories } from "../hooks/useCategories";
import { useUsers } from "../hooks/useUsers";

export function ApprovalDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { nameOf: categoryNameOf, isLoading: categoriesLoading } = useCategories();
  const { nameOf: userNameOf, isLoading: usersLoading } = useUsers();
  const [claim, setClaim] = useState<ExpenseClaim | null>(null);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) return;
    getExpenseClaim(claimId).then(setClaim);
  }, [claimId]);

  if (claim === null || categoriesLoading || usersLoading) {
    return (
      <AppShellLayout role="Manager">
        <Heading level={1}>Review Claim</Heading>
        <Center height={200}>
          <Spinner size="lg" label="Loading claim" />
        </Center>
      </AppShellLayout>
    );
  }

  async function decide(action: "approve" | "reject") {
    if (!claimId) return;
    if (action === "reject" && !comment.trim()) {
      setError("A comment is required to reject a claim.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (action === "approve") {
        await approveExpenseClaim(claimId, { comment });
      } else {
        await rejectExpenseClaim(claimId, { comment });
      }
      navigate("/approvals");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the decision.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShellLayout role="Manager">
      <Heading level={1}>Review Claim</Heading>
      {error && <Banner status="error" title={error} />}
      <Card>
        <VStack gap={3}>
          <Text type="body">Employee: {userNameOf(claim.employeeId)}</Text>
          <Text type="body">Category: {categoryNameOf(claim.categoryId)}</Text>
          <Text type="body">Amount: {claim.amount.toFixed(2)}</Text>
          <Text type="body">Description: {claim.description}</Text>
          <TextArea label="Comment" value={comment} onChange={setComment} />
          <HStack gap={2} justify="end">
            <Button
              label="Reject"
              variant="destructive"
              isLoading={isSaving}
              onClick={() => void decide("reject")}
            />
            <Button
              label="Approve"
              variant="primary"
              isLoading={isSaving}
              onClick={() => void decide("approve")}
            />
          </HStack>
        </VStack>
      </Card>
    </AppShellLayout>
  );
}
