import type { CsvFormat } from "@app/types";

import { request } from "./client";

export const csvFormatsApi = {
  list: () => request<CsvFormat[]>("/csv-formats"),
};
