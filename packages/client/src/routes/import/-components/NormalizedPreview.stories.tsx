import type { Meta, StoryObj } from "@storybook/react-vite";

import { normalizedWithProblems, sampleNormalized } from "./importStoryData";
import { NormalizedPreview } from "./NormalizedPreview";

const meta = {
  title: "Pages/Import/NormalizedPreview",
  component: NormalizedPreview,
  args: {
    normalized: sampleNormalized,
  },
} satisfies Meta<typeof NormalizedPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every row readable: the first 5 as they'll be imported. */
export const Default: Story = {};

/** Some rows have an unreadable date or total; they're listed by row number and skipped. */
export const WithProblems: Story = {
  args: {
    normalized: normalizedWithProblems,
  },
};

/** Nothing readable. */
export const Empty: Story = {
  args: {
    normalized: {
      rows: [],
      problems: [],
    },
  },
};
