import type { ColumnChoice } from "../-utils/columnChoices";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TransactionColumn } from "@app/types";
import { fn } from "storybook/test";

import { CsvPreviewTable } from "./CsvPreviewTable";
import { headerlessCsv, sampleColumnMap, sampleCsv } from "./importStoryData";
import { IGNORE } from "../-utils/columnChoices";

const meta = {
  title: "Pages/Import/CsvPreviewTable",
  component: CsvPreviewTable,
  args: {
    csv: sampleCsv,
  },
} satisfies Meta<typeof CsvPreviewTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Manual mapping: an editable dropdown above every column, all starting as Ignore. */
export const ManualMapping: Story = {
  args: {
    onChoiceChange: fn(),
  },
  render: function Render(args) {
    const [choices, setChoices] = useState<ColumnChoice[]>(args.csv.labels.map(() => IGNORE));
    return (
      <CsvPreviewTable
        csv={args.csv}
        choices={choices}
        onChoiceChange={(index, choice) => {
          args.onChoiceChange?.(index, choice);
          setChoices(prev => prev.map((c, i) => (i === index ? choice : c)));
        }}
      />
    );
  },
};

/** Manual mapping part-way through, including a custom field with its name input. */
export const PartlyMapped: Story = {
  args: {
    choices: [
      {
        kind: "field",
        field: TransactionColumn.Date,
      },
      {
        kind: "field",
        field: TransactionColumn.Payee,
      },
      IGNORE,
      {
        kind: "custom",
        name: "Kind",
      },
    ],
    onChoiceChange: fn(),
  },
};

/** Read with a saved format: its mapping is shown as read-only labels. */
export const SavedFormat: Story = {
  args: {
    columnMap: sampleColumnMap,
  },
};

/** A file with no header row: columns are labelled "Column N" and row 1 is data. */
export const Headerless: Story = {
  args: {
    csv: headerlessCsv,
    choices: headerlessCsv.labels.map(() => IGNORE),
    onChoiceChange: fn(),
  },
};
