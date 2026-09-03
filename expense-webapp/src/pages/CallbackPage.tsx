import { useEffect, useState } from "react";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { handleCallback } from "../auth";

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback()
      .then(() => {
        window.location.assign("/");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Sign-in failed");
      });
  }, []);

  return (
    <Center height="100vh">
      <VStack gap={3} hAlign="center">
        <Spinner size="lg" />
        <Text type="body" color={error ? "primary" : "secondary"}>
          {error ? `Sign-in failed: ${error}` : "Completing sign-in…"}
        </Text>
      </VStack>
    </Center>
  );
}
