import type { Transaction } from "@app/types";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { useTransactions } from "@/hooks/useTransactions";
import { formatMoney } from "@/lib/labels";

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    size: 110,
  },
  {
    accessorKey: "time",
    header: "Time",
    size: 90,
    cell: ({
      row,
    }) => row.original.time ?? "",
  },
  {
    accessorKey: "name",
    header: "Name",
    meta: {
      fill: true,
    },
  },
  {
    accessorKey: "payeeName",
    header: "Payee",
    size: 200,
  },
  {
    accessorKey: "total",
    header: "Total",
    size: 110,
    cell: ({
      row,
    }) => <span className="tabular-nums">{formatMoney(row.original.total)}</span>,
  },
  {
    accessorKey: "accountName",
    header: "Account",
    size: 160,
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 240,
    cell: ({
      row,
    }) => row.original.description ?? "",
  },
];

/** Every imported transaction across all accounts, in one sortable table. */
export function TransactionsTable() {
  const {
    data: transactions = [], isLoading,
  } = useTransactions();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      {isLoading
        ? <p className="text-muted-foreground">Loading…</p>
        : (
          <DataTable
            columns={columns}
            data={transactions}
            sortable
            emptyMessage="No transactions yet — import a CSV to get started."
          />
        )}
    </div>
  );
}
