import type { CreateEntityInput, UpdateEntityInput } from "@app/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ACCOUNTS_QUERY_KEY, ENTITIES_QUERY_KEY, TRANSACTIONS_QUERY_KEY } from "@/hooks/queryKeys";
import { entitiesApi } from "@/lib/api/entities";
import { describeError } from "@/lib/apiError";
import { notifyError, notifySuccess } from "@/lib/notifications";

export function useEntities() {
  return useQuery({
    queryKey: ENTITIES_QUERY_KEY,
    queryFn: entitiesApi.list,
  });
}

/** Entities plus the queries that embed entity names (accounts, transactions). */
function useEntitiesInvalidation() {
  const queryClient = useQueryClient();
  return () => Promise.all([ENTITIES_QUERY_KEY, ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY]
    .map(queryKey => queryClient.invalidateQueries({
      queryKey,
    })));
}

export function useCreateEntity() {
  const invalidate = useEntitiesInvalidation();
  return useMutation({
    mutationFn: (input: CreateEntityInput) => entitiesApi.create(input),
    onSuccess: (entity) => {
      void invalidate();
      notifySuccess(`Created "${entity.name}"`);
    },
    onError: err => notifyError(describeError(err)),
  });
}

/** Silent — edit surfaces toast per field via `lib/autoSave`. */
export function useUpdateEntity() {
  const invalidate = useEntitiesInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateEntityInput; }) => entitiesApi.update(id, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteEntity() {
  const invalidate = useEntitiesInvalidation();
  return useMutation({
    mutationFn: (id: string) => entitiesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      notifySuccess("Deleted entity");
    },
    onError: err => notifyError(describeError(err)),
  });
}
