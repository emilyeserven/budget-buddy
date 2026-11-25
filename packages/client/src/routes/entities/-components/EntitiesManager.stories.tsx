import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { EntitiesManager } from "./EntitiesManager";

import { apiHandlers } from "@/test-utils/story-mocks";

const meta = {
  title: "Pages/Entities/EntitiesManager",
  component: EntitiesManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof EntitiesManager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Entities with auto-saving name, type and default split. */
export const Default: Story = {};

/** The empty state. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get("/api/entities", () => HttpResponse.json([])), ...apiHandlers],
    },
  },
};
