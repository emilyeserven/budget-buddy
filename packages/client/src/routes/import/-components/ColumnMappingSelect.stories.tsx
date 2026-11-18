import type { ColumnChoice } from "../-utils/columnChoices";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TransactionColumn } from "@app/types";
import { fn } from "storybook/test";

import { ColumnMappingSelect } from "./ColumnMappingSelect";
import { IGNORE } from "../-utils/columnChoices";

const meta = {
  title: "Pages/Import/ColumnMappingSelect",
  component: ColumnMappingSelect,
  args: {
    header: "Merchant",
    choice: IGNORE,
    onChange: fn(),
  },
  // Controlled in the page; keep local state here so the dropdown is interactive.
  render: function Render(args) {
    const [choice, setChoice] = useState<ColumnChoice>(args.choice);
    return (
      <ColumnMappingSelect
        {...args}
        choice={choice}
        onChange={(next) => {
          args.onChange(next);
          setChoice(next);
        }}
      />
    );
  },
} satisfies Meta<typeof ColumnMappingSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Ignored (the starting state for every column). */
export const Ignored: Story = {};

/** Mapped to a Transaction field. */
export const Field: Story = {
  args: {
    choice: {
      kind: "field",
      field: TransactionColumn.Payee,
    },
  },
};

/** Kept as a custom field: shows the name input below the dropdown. */
export const Custom: Story = {
  args: {
    header: "Kind",
    choice: {
      kind: "custom",
      name: "Kind",
    },
  },
};
