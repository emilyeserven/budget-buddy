import type { Account, UpdateAccountInput } from "@app/types";
import type { ColumnDef } from "@tanstack/react-table";

import { Trash2 } from "lucide-react";

import { AccountForm } from "@/components/AccountForm";
import { EnumSelect } from "@/components/EnumSelect";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useAccounts, useDeleteAccount, useUpdateAccount } from "@/hooks/useAccounts";
import { describeError } from "@/lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";

/** Auto-save one field of an account, toasting with the field's label. */
function useSaveAccountField(account: Account) {
  const update = useUpdateAccount();
  return (label: string, input: UpdateAccountInput) => update.mutate({
    id: account.id,
    input,
  }, {
    onSuccess: () => notifyFieldSaved(label),
    onError: err => notifyFieldSaveError(label, describeError(err)),
  });
}

function NameCell({
  account,
}: { account: Account }) {
  const save = useSaveAccountField(account);
  return (
    <Input
      aria-label={`Name of ${account.name}`}
      defaultValue={account.name}
      onBlur={(e) => {
        const name = e.target.value.trim();
        if (name && name !== account.name) save("Name", {
          name,
        });
      }}
    />
  );
}

function TypeCell({
  account,
}: { account: Account }) {
  const save = useSaveAccountField(account);
  return (
    <EnumSelect
      size="sm"
      aria-label={`Type of ${account.name}`}
      labels={ACCOUNT_TYPE_LABELS}
      value={account.type}
      onChange={(type) => {
        if (type !== account.type) save("Type", {
          type,
        });
      }}
    />
  );
}

function InvertCell({
  account,
}: { account: Account }) {
  const save = useSaveAccountField(account);
  return (
    <Checkbox
      aria-label={`Invert amounts for ${account.name}`}
      checked={account.invertAmounts}
      onCheckedChange={checked => save("Invert amounts", {
        invertAmounts: checked === true,
      })}
    />
  );
}

function DeleteCell({
  account,
}: { account: Account }) {
  const remove = useDeleteAccount();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${account.name}`}
      onClick={() => remove.mutate(account.id)}
    >
      <Trash2 />
    </Button>
  );
}

const columns: ColumnDef<Account>[] = [
  {
    id: "name",
    header: "Name",
    meta: {
      fill: true,
    },
    cell: ({
      row,
    }) => <NameCell account={row.original} />,
  },
  {
    id: "type",
    header: "Type",
    size: 140,
    cell: ({
      row,
    }) => <TypeCell account={row.original} />,
  },
  {
    accessorKey: "institutionName",
    header: "Institution",
    size: 160,
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    size: 140,
  },
  {
    id: "invert",
    header: "Invert",
    size: 70,
    cell: ({
      row,
    }) => <InvertCell account={row.original} />,
  },
  {
    id: "delete",
    header: "",
    size: 56,
    cell: ({
      row,
    }) => <DeleteCell account={row.original} />,
  },
];

/** Cards and bank accounts; fields auto-save. */
export function AccountsManager() {
  const {
    data: accounts = [], isLoading,
  } = useAccounts();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <RowCard className="p-4">
        <AccountForm />
      </RowCard>
      {isLoading
        ? <p className="text-muted-foreground">Loading…</p>
        : (
          <DataTable
            columns={columns}
            data={accounts}
            emptyMessage="No accounts yet."
          />
        )}
    </div>
  );
}
