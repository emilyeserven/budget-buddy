import type { LucideIcon } from "lucide-react";

import { Building2, FileUp, Receipt, Users } from "lucide-react";

/** A main page of the app — listed in the sidebar and as a tile on Home. */
export interface AppPage {
  to: "/import" | "/transactions" | "/accounts" | "/entities";
  label: string;
  description: string;
  icon: LucideIcon;
}

/** The app's main pages, in navigation order. Add a top-level page here. */
export const APP_PAGES: AppPage[] = [
  {
    to: "/import",
    label: "Import CSV",
    description: "Upload a bank or card export and add its transactions.",
    icon: FileUp,
  },
  {
    to: "/transactions",
    label: "Transactions",
    description: "Every imported transaction across all accounts.",
    icon: Receipt,
  },
  {
    to: "/accounts",
    label: "Accounts",
    description: "Cards and bank accounts, and how their amounts are signed.",
    icon: Building2,
  },
  {
    to: "/entities",
    label: "Entities",
    description: "Merchants, institutions, friends and household members.",
    icon: Users,
  },
];
