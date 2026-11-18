import type { ImportTransactionsInput } from "@app/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ACCOUNTS_QUERY_KEY,
  CSV_FORMATS_QUERY_KEY,
  ENTITIES_QUERY_KEY,
  TRANSACTIONS_QUERY_KEY,
} from "@/hooks/queryKeys";
import { transactionsApi } from "@/lib/api/transactions";
import { describeError } from "@/lib/apiError";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEY,
    queryFn: transactionsApi.list,
  });
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Import normalized rows. Invalidates everything an import can touch (payees, formats, accounts). */
export function useImportTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportTransactionsInput) => transactionsApi.import(input),
    onSuccess: (result) => {
      for (const queryKey of [TRANSACTIONS_QUERY_KEY, ENTITIES_QUERY_KEY, CSV_FORMATS_QUERY_KEY, ACCOUNTS_QUERY_KEY]) {
        void queryClient.invalidateQueries({
          queryKey,
        });
      }
      notifySuccess(
        `Imported ${plural(result.imported, "transaction")}, skipped ${result.skipped} already imported, created ${plural(result.createdPayees, "payee")}`,
      );
    },
    onError: err => notifyError(describeError(err)),
  });
}
