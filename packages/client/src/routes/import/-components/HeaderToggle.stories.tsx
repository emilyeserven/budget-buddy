import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { fn } from "storybook/test";

import { HeaderToggle } from "./HeaderToggle";

const meta = {
  title: "Pages/Import/HeaderToggle",
  component: HeaderToggle,
  args: {
    checked: true,
    onChange: fn(),
  },
  render: function Render(args) {
    const [checked, setChecked] = useState(args.checked);
    return (
      <HeaderToggle
        {...args}
        checked={checked}
        onChange={(next) => {
          args.onChange(next);
          setChecked(next);
        }}
      />
    );
  },
} satisfies Meta<typeof HeaderToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Row 1 is a header (the usual case). */
export const Checked: Story = {};

/** No header row: every row is data. */
export const Unchecked: Story = {
  args: {
    checked: false,
  },
};

/** A saved format decides, so the checkbox is locked and says which format set it. */
export const LockedByFormat: Story = {
  args: {
    checked: false,
    lockedBy: "Card export",
  },
};
