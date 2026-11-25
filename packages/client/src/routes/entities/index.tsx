import { createFileRoute } from "@tanstack/react-router";

import { EntitiesManager } from "./-components/EntitiesManager";

export const Route = createFileRoute("/entities/")({
  component: EntitiesManager,
});
