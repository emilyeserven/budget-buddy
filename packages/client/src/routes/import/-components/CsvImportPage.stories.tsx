import type { Meta, StoryObj } from "@storybook/react-vite";

import { CsvImportPage } from "./CsvImportPage";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Pages/Import/CsvImportPage",
  component: CsvImportPage,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof CsvImportPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Upload a CSV to preview it, pick a saved format or map columns, and import. */
export const Default: Story = {};
