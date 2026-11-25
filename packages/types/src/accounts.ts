/** Accounts — a card or bank account, managed by an institution Entity and owned by an Entity. */

export const AccountType = {
  Debit: "debit",
  Credit: "credit",
  Checking: "checking",
  Savings: "savings",
} as const;
export type AccountType = typeof AccountType[keyof typeof AccountType];

/** An account as returned by the API, with its institution/owner names joined server-side. */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institutionId: string;
  institutionName: string;
  ownerId: string;
  ownerName: string;
  /** When true, imported amounts are negated so stored totals use "negative = money out". */
  invertAmounts: boolean;
  csvFormatId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/accounts` body. */
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  institutionId: string;
  ownerId: string;
  invertAmounts?: boolean;
  csvFormatId?: string | null;
}

/** `PATCH /api/accounts/:id` body. */
export type UpdateAccountInput = Partial<CreateAccountInput>;
