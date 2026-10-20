import type { QueryClient } from "@tanstack/react-query";

// Keep the active session observer attached while removing private cached data.
export async function endSession(client: QueryClient) {
  await client.cancelQueries();
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
  client.setQueryData(["me"], null);
}
