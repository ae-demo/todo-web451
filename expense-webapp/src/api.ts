import createClient from "openapi-fetch";
import type { paths, components } from "./generated/expense-api";
import { getAccessToken, signIn } from "./auth";

export type ExpenseClaim = components["schemas"]["ExpenseClaim"];
export type NewExpenseClaim = components["schemas"]["NewExpenseClaim"];
export type ClaimDecision = components["schemas"]["ClaimDecision"];
export type User = components["schemas"]["User"];
export type ExpenseCategory = components["schemas"]["ExpenseCategory"];

const client = createClient<paths>({ baseUrl: "/api" });

client.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      await signIn();
    }
    return response;
  },
});

// The X-User-Id header is documented on every operation as "caller identity
// injected by the gateway from the validated token" — the browser never
// knows it and never needs to send a real one: nginx's /api proxy clears any
// inbound X-User-* headers before the request reaches the gateway, which
// injects the true identity itself. This placeholder only satisfies the
// generated client's required-parameter typing.
const identityHeader = { "X-User-Id": "gateway-injected" } as const;

function unwrap<T>(data: T | undefined, error: unknown): T {
  if (error !== undefined) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function listExpenseClaims(query: {
  employeeId?: string;
  status?: "submitted" | "approved" | "rejected";
  limit?: number;
  offset?: number;
}) {
  const { data, error } = await client.GET("/expense-claims", {
    params: { header: identityHeader, query },
  });
  return unwrap(data, error);
}

export async function submitExpenseClaim(body: NewExpenseClaim) {
  const { data, error } = await client.POST("/expense-claims", {
    params: { header: identityHeader },
    body,
  });
  return unwrap(data, error);
}

export async function getExpenseClaim(claimId: string) {
  const { data, error } = await client.GET("/expense-claims/{claimId}", {
    params: { header: identityHeader, path: { claimId } },
  });
  return unwrap(data, error);
}

export async function updateExpenseClaim(claimId: string, body: NewExpenseClaim) {
  const { data, error } = await client.PUT("/expense-claims/{claimId}", {
    params: { header: identityHeader, path: { claimId } },
    body,
  });
  return unwrap(data, error);
}

export async function approveExpenseClaim(claimId: string, body: ClaimDecision) {
  const { data, error } = await client.POST("/expense-claims/{claimId}/approve", {
    params: { header: identityHeader, path: { claimId } },
    body,
  });
  return unwrap(data, error);
}

export async function rejectExpenseClaim(claimId: string, body: ClaimDecision) {
  const { data, error } = await client.POST("/expense-claims/{claimId}/reject", {
    params: { header: identityHeader, path: { claimId } },
    body,
  });
  return unwrap(data, error);
}

export async function exportExpenseClaims(from: string, to: string): Promise<string> {
  const { data, error, response } = await client.GET("/expense-claims/export", {
    params: { header: identityHeader, query: { from, to } },
    parseAs: "text",
  });
  if (error !== undefined || !response.ok) {
    throw new Error("Export failed");
  }
  return data as unknown as string;
}

export async function listUsers(query: { limit?: number; offset?: number } = {}) {
  const { data, error } = await client.GET("/users", {
    params: { header: identityHeader, query },
  });
  return unwrap(data, error);
}

export async function assignManager(userId: string, managerId: string) {
  const { data, error } = await client.PUT("/users/{userId}/manager", {
    params: { header: identityHeader, path: { userId } },
    body: { managerId },
  });
  return unwrap(data, error);
}

export async function listExpenseCategories() {
  const { data, error } = await client.GET("/expense-categories", {
    params: { header: identityHeader },
  });
  return unwrap(data, error);
}

export async function createExpenseCategory(name: string) {
  const { data, error } = await client.POST("/expense-categories", {
    params: { header: identityHeader },
    body: { name },
  });
  return unwrap(data, error);
}

export async function updateExpenseCategory(
  categoryId: string,
  body: { name?: string; active?: boolean },
) {
  const { data, error } = await client.PATCH("/expense-categories/{categoryId}", {
    params: { header: identityHeader, path: { categoryId } },
    body,
  });
  return unwrap(data, error);
}
