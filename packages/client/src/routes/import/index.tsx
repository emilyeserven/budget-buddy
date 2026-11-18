import { createFileRoute } from "@tanstack/react-router";

import { CsvImportPage } from "./-components/CsvImportPage";

export const Route = createFileRoute("/import/")({
  component: CsvImportPage,
});
