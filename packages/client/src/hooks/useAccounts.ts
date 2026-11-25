import type { CreateAccountInput, UpdateAccountInput } from "@app/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY } from "@/hooks/queryKeys";
import { accountsApi } from "@/lib/api/accounts";
import { describeError } from "@/lib/apiError";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: accountsApi.list,
  });
}

/** Accounts plus transactions (which embed the account name). */
function useAccountsInvalidation() {
  const queryClient = useQueryClient();
  return () => Promise.all([ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY]
    .map(queryKey => queryClient.invalidateQueries({
      queryKey,
    })));
}

export function useCreateAccount() {
  const invalidate = useAccountsInvalidation();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: (account) => {
      void invalidate();
      notifySuccess(`Created account "${account.name}"`);
    },
    onError: err => notifyError(describeError(err)),
  });
}

/** Silent — edit surfaces toast per field via `lib/autoSave`. */
export function useUpdateAccount() {
  const invalidate = useAccountsInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateAccountInput; }) => accountsApi.update(id, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteAccount() {
  const invalidate = useAccountsInvalidation();
  return useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      notifySuccess("Deleted account");
    },
    onError: err => notifyError(describeError(err)),
  });
}
