import type { ImportResult, ImportTransactionsInput, Transaction } from "@app/types";

import { request } from "./client";

export const transactionsApi = {
  list: () => request<Transaction[]>("/transactions"),
  import: (input: ImportTransactionsInput) =>
    request<ImportResult>("/transactions/import", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
