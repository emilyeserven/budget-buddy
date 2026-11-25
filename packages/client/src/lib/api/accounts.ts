import type { Account, CreateAccountInput, UpdateAccountInput } from "@app/types";

import { createCrudApi } from "./client";

export const accountsApi = createCrudApi<Account, CreateAccountInput, UpdateAccountInput>("accounts");
