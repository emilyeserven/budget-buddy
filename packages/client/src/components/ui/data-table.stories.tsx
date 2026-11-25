import type { Transaction } from "@app/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";

import { fn, userEvent, within } from "storybook/test";

import { DataTable } from "./data-table";

import { makeTransaction } from "@/test-utils/factories";

const transactions: Transaction[] = [
  makeTransaction(),
  makeTransaction({
    id: "transaction-2",
    name: "CORNER BAKERY #12",
    date: "2025-03-11",
    total: -6.5,
    payeeName: "CORNER BAKERY",
  }),
  makeTransaction({
    id: "transaction-3",
    name: "Initech, Inc. DIRECT DEP",
    date: "2025-03-12",
    total: 750,
    payeeName: "Initech, Inc.",
  }),
  makeTransaction({
    id: "transaction-4",
    name: "PIXEL ARCADE",
    date: "2025-03-08",
    total: -30,
    payeeName: "PIXEL ARCADE",
    accountName: "Everyday Card",
  }),
];

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    size: 110,
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
    size: 180,
  },
  {
    accessorKey: "total",
    header: "Total",
    size: 100,
  },
  {
    accessorKey: "accountName",
    header: "Account",
    size: 140,
  },
];

const meta = {
  title: "UI/DataTable",
  component: DataTable<Transaction>,
  args: {
    columns,
    data: transactions,
  },
} satisfies Meta<typeof DataTable<Transaction>>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Plain table: rows in the given order. */
export const Default: Story = {};

/** Click a header to sort; click again to reverse. */
export const Sortable: Story = {
  args: {
    sortable: true,
  },
};

/** Drag the handle on a header's right edge to resize the column. */
export const Resizable: Story = {
  args: {
    resizable: true,
  },
};

/** Rows are clickable (interactive cells such as buttons don't trigger it). */
export const ClickableRows: Story = {
  args: {
    onRowClick: fn(),
  },
};

/** No rows: shows the empty message. */
export const Empty: Story = {
  args: {
    data: [],
    emptyMessage: "No transactions yet — import a CSV to get started.",
  },
};

interface SpendingGroup {
  name: string;
  total: number;
  children?: SpendingGroup[];
}

const groupColumns: ColumnDef<SpendingGroup>[] = [
  {
    accessorKey: "name",
    header: "Group",
    meta: {
      fill: true,
    },
    cell: ({
      row,
    }) => (
      <span
        style={{
          paddingLeft: `${row.depth * 1.25}rem`,
        }}
      >
        {row.getCanExpand()
          ? (
            <button
              type="button"
              className="mr-1"
              aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${row.original.name}`}
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? "▾" : "▸"}
            </button>
          )
          : null}
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    size: 100,
  },
];

const groups: SpendingGroup[] = [
  {
    name: "Food",
    total: -36.5,
    children: [
      {
        name: "CORNER BAKERY",
        total: -6.5,
      },
      {
        name: "PIXEL ARCADE",
        total: -30,
      },
    ],
  },
  {
    name: "Utilities",
    total: -42.17,
    children: [{
      name: "NORTHWIND UTILITIES",
      total: -42.17,
    }],
  },
];

/** Tree data via `getSubRows`: groups expand to show their rows ("Food" starts expanded). */
export const TreeRows: StoryObj<Meta<typeof DataTable<SpendingGroup>>> = {
  play: async ({
    canvasElement,
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "Expand Food",
    }));
  },
  render: () => (
    <DataTable
      columns={groupColumns}
      data={groups}
      getSubRows={row => row.children}
    />
  ),
};
