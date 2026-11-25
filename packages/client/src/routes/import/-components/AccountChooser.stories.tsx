import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";
import { fn, userEvent, within } from "storybook/test";

import { AccountChooser } from "./AccountChooser";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Pages/Import/AccountChooser",
  component: AccountChooser,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: null,
    onChange: fn(),
  },
} satisfies Meta<typeof AccountChooser>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No account chosen yet. */
export const Default: Story = {};

/** An account preselected (e.g. by a saved format). */
export const Selected: Story = {
  args: {
    value: "account-1",
  },
};

/** No accounts exist yet: only "New account…" is useful. */
export const NoAccounts: Story = {
  parameters: {
    msw: {
      handlers: [http.get("/api/accounts", () => HttpResponse.json([])), ...apiHandlers],
    },
  },
};

/** The "New account" dialog, with inline institution/owner creation. */
export const NewAccountDialog: Story = {
  play: async ({
    canvasElement,
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "New account…",
    }));
  },
};
