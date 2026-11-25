/**
 * Module-level query keys for the finance entities, kept together because their invalidation graph
 * crosses entities: accounts embed entity names, transactions embed account and entity names, and
 * an import can create payees, formats, and link a format to an account.
 */
export const ENTITIES_QUERY_KEY = ["entities"] as const;
export const ACCOUNTS_QUERY_KEY = ["accounts"] as const;
export const CSV_FORMATS_QUERY_KEY = ["csvFormats"] as const;
export const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;
