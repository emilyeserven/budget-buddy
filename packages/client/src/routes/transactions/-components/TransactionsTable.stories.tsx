import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { TransactionsTable } from "./TransactionsTable";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Pages/Transactions/TransactionsTable",
  component: TransactionsTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof TransactionsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every transaction across accounts, sortable by column. */
export const Default: Story = {};

/** The empty state. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get("/api/transactions", () => HttpResponse.json([])), ...apiHandlers],
    },
  },
};
