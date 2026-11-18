import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { AccountsManager } from "./AccountsManager";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Pages/Accounts/AccountsManager",
  component: AccountsManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AccountsManager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Accounts with the inline create form; fields auto-save. */
export const Default: Story = {};

/** The empty state. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get("/api/accounts", () => HttpResponse.json([])), ...apiHandlers],
    },
  },
};
