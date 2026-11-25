import type { Meta, StoryObj } from "@storybook/react-vite";

import { MappingOptions } from "./MappingOptions";
import { useColumnMapping } from "./useColumnMapping";

/** `MappingOptions` takes the live `useColumnMapping()` state, so stories render it through the hook. */
function MappingOptionsDemo({
  problems,
}: { problems: string[] }) {
  const mapping = useColumnMapping();
  return (
    <MappingOptions
      mapping={mapping}
      problems={problems}
    />
  );
}

const meta = {
  title: "Pages/Import/MappingOptions",
  component: MappingOptionsDemo,
  args: {
    problems: [],
  },
} satisfies Meta<typeof MappingOptionsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Date format and optional format name, with a complete mapping. */
export const Default: Story = {};

/** An incomplete mapping lists what's still missing. */
export const WithProblems: Story = {
  args: {
    problems: [
      "Map a Total column.",
      "Map at least one of Payee, Name, or Description.",
    ],
  },
};
