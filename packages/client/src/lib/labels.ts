import { AccountType, DateFormat, DefaultSplit, EntityType } from "@app/types";

/** Display labels for the finance enums, shared by every page that renders or picks them. */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.Commercial]: "Commercial",
  [EntityType.Friend]: "Friend",
  [EntityType.Household]: "Household",
};

export const DEFAULT_SPLIT_LABELS: Record<DefaultSplit, string> = {
  [DefaultSplit.None]: "No split",
  [DefaultSplit.Half]: "Half",
  [DefaultSplit.All]: "All",
  [DefaultSplit.Special]: "Special",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.Debit]: "Debit",
  [AccountType.Credit]: "Credit",
  [AccountType.Checking]: "Checking",
  [AccountType.Savings]: "Savings",
};

export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  [DateFormat.Iso]: "YYYY-MM-DD",
  [DateFormat.US]: "MM/DD/YYYY (US)",
  [DateFormat.EU]: "DD/MM/YYYY",
};

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

/** Format a stored total for display. */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}
