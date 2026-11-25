import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import { AllRowsSection } from "./AllRowsSection";
import { headerlessCsv, longCsv, sampleCsv } from "./importStoryData";

const meta = {
  title: "Pages/Import/AllRowsSection",
  component: AllRowsSection,
  args: {
    csv: sampleCsv,
  },
} satisfies Meta<typeof AllRowsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed: just the toggle with the row count. */
export const Collapsed: Story = {};

/** Expanded on a 120-row file: the table scrolls inside its frame and keeps its column headings in view. */
export const ExpandedLongFile: Story = {
  args: {
    csv: longCsv,
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: /All rows in the file/,
    }));
    await expect(await canvas.findByText("120")).toBeInTheDocument();
  },
};

/** Expanded on a headerless file: rows are numbered from 1. */
export const ExpandedHeaderless: Story = {
  args: {
    csv: headerlessCsv,
  },
  play: async ({
    canvasElement,
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: /All rows in the file/,
    }));
  },
};
