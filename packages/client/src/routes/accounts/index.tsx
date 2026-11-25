import { createFileRoute } from "@tanstack/react-router";

import { AccountsManager } from "./-components/AccountsManager";

export const Route = createFileRoute("/accounts/")({
  component: AccountsManager,
});
