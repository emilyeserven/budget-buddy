import type { Meta, StoryObj } from "@storybook/react-vite";

import { fn } from "storybook/test";

import { FormatChooser } from "./FormatChooser";

import { makeCsvFormat } from "@/test-utils/factories";
import { apiHandlers } from "@/test-utils/story-mocks";

const cardFormat = makeCsvFormat();
const otherFormat = makeCsvFormat({
  id: "format-2",
  name: "Acme Bank export",
  accountId: null,
});

const meta = {
  title: "Pages/Import/FormatChooser",
  component: FormatChooser,
  // Account and institution names for each button come from the API.
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    matches: [cardFormat],
    selected: cardFormat,
    onChoose: fn(),
  },
} satisfies Meta<typeof FormatChooser>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One saved format fits and is preselected. */
export const OneMatch: Story = {};

/** Several formats fit; the second is named after its institution rather than an account. */
export const SeveralMatches: Story = {
  args: {
    matches: [cardFormat, otherFormat],
  },
};

/** Nothing fits: manual mapping is the only option. */
export const NoMatches: Story = {
  args: {
    matches: [],
    selected: null,
  },
};
