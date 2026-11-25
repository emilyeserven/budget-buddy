import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomePage } from "./HomePage";

const meta = {
  title: "Pages/Home/HomePage",
  component: HomePage,
} satisfies Meta<typeof HomePage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One tile per main page. */
export const Default: Story = {};
