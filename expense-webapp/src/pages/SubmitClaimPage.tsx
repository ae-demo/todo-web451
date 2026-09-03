import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { DateInput } from "@astryxdesign/core/DateInput";
import type { ISODateString } from "@astryxdesign/core/utils";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FileInput } from "@astryxdesign/core/FileInput";
import { HStack } from "@astryxdesign/core/HStack";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Banner } from "@astryxdesign/core/Banner";
import { AppShellLayout } from "../components/AppShellLayout";
import { useCategories } from "../hooks/useCategories";
import {
  getExpenseClaim,
  submitExpenseClaim,
  updateExpenseClaim,
} from "../api";

export function SubmitClaimPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimId = searchParams.get("claimId");
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [isLoadingClaim, setIsLoadingClaim] = useState(!!claimId);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [claimDate, setClaimDate] = useState<ISODateString | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!claimId) return;
    setIsLoadingClaim(true);
    getExpenseClaim(claimId)
      .then((claim) => {
        setCategoryId(claim.categoryId);
        setAmount(claim.amount);
        setClaimDate(claim.claimDate as ISODateString);
        setDescription(claim.description);
        setExistingReceiptUrl(claim.receiptUrl);
      })
      .catch(() => setError("Could not load the claim to edit."))
      .finally(() => setIsLoadingClaim(false));
  }, [claimId]);

  async function handleSubmit() {
    if (!categoryId || amount == null || !claimDate || !description) {
      setError("Fill in category, amount, date, and description.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // expense-api has no dedicated upload endpoint; NewExpenseClaim just
      // carries a receiptUrl string, so a freshly attached file is turned
      // into a local object URL the claim record can point at.
      const receiptUrl = receiptFile
        ? URL.createObjectURL(receiptFile)
        : existingReceiptUrl;
      if (!receiptUrl) {
        setError("Attach a receipt.");
        setIsSubmitting(false);
        return;
      }
      const body = { categoryId, amount, claimDate, description, receiptUrl };
      if (claimId) {
        await updateExpenseClaim(claimId, body);
        navigate(`/claims/${claimId}`);
      } else {
        const created = await submitExpenseClaim(body);
        navigate(`/claims/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the claim.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isLoadingClaim || categoriesLoading;

  return (
    <AppShellLayout role="Employee">
      <Heading level={1}>Submit Expense Claim</Heading>
      {error && <Banner status="error" title={error} />}
      {isLoading ? (
        <Center height={200}>
          <Spinner size="lg" label="Loading" />
        </Center>
      ) : (
        <Card>
          <FormLayout>
            <Selector
              label="Category"
              placeholder="Choose a category"
              options={categories
                .filter((c) => c.active)
                .map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
            />
            <NumberInput
              label="Amount"
              value={amount}
              onChange={setAmount}
              min={0}
              step={0.01}
            />
            <DateInput label="Date" value={claimDate} onChange={setClaimDate} />
            <TextArea
              label="Description"
              value={description}
              onChange={setDescription}
            />
            <FileInput
              label="Attach receipt"
              value={receiptFile}
              onChange={(files) =>
                setReceiptFile(Array.isArray(files) ? files[0] ?? null : files)
              }
              description={
                existingReceiptUrl && !receiptFile
                  ? "A receipt is already attached. Choose a file to replace it."
                  : undefined
              }
            />
            <HStack gap={2} justify="end">
              <Button
                label="Cancel"
                variant="secondary"
                onClick={() => navigate("/my-claims")}
              />
              <Button
                label="Submit"
                variant="primary"
                isLoading={isSubmitting}
                onClick={() => void handleSubmit()}
              />
            </HStack>
          </FormLayout>
        </Card>
      )}
    </AppShellLayout>
  );
}
