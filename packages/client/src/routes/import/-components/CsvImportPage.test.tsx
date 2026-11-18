import type { ImportTransactionsInput } from "@app/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CsvImportPage } from "./CsvImportPage";

import { useNotificationStore } from "@/stores/notificationStore";
import { makeAccount, makeCsvFormat, makeEntity } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

const CSV = "Posted On,Merchant,Value\n3/11/2025,CORNER BAKERY,6.50\n3/10/2025,NORTHWIND UTILITIES,42.17\n";

function stubApi(formats = [makeCsvFormat()]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      return Response.json({
        imported: 2,
        skipped: 0,
        createdPayees: 2,
        csvFormatId: "format-1",
      });
    }
    if (url.endsWith("/csv-formats")) return Response.json(formats);
    if (url.endsWith("/accounts")) return Response.json([makeAccount()]);
    return Response.json([makeEntity()]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function upload(text: string) {
  const input = screen.getByLabelText("CSV file");
  fireEvent.change(input, {
    target: {
      files: [new File([text], "statement.csv", {
        type: "text/csv",
      })],
    },
  });
  await screen.findByText(/statement\.csv: 2 rows, 3 columns/);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CsvImportPage", () => {
  it("reads a file with the matching saved format, previews it, and imports into the format's account", async () => {
    const fetchMock = stubApi();
    await renderWithRouter(<CsvImportPage />, {
      paths: ["/transactions"],
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/csv-formats", expect.anything()));
    await upload(CSV);

    expect(await screen.findByRole("button", {
      name: /Read as Checking/,
    })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Ready to import: 2 rows")).toBeInTheDocument();

    const importButton = screen.getByRole("button", {
      name: "Import",
    });
    await waitFor(() => expect(importButton).toBeEnabled());
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/transactions/import", expect.objectContaining({
        method: "POST",
      }));
    });
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/transactions/import"));
    const body = JSON.parse(String(call?.[1]?.body)) as ImportTransactionsInput;
    expect(body).toMatchObject({
      accountId: "account-1",
      csvFormatId: "format-1",
      newFormat: null,
    });
    expect(body.rows[0]).toMatchObject({
      date: "2025-03-11",
      payeeName: "CORNER BAKERY",
      total: 6.5,
      rawCSV: "3/11/2025,CORNER BAKERY,6.50",
    });
    await waitFor(() => {
      expect(useNotificationStore.getState().notifications[0]?.message).toMatch(/^Imported 2 transactions/);
    });
  });

  it("falls back to manual mapping when no saved format fits", async () => {
    stubApi([]);
    await renderWithRouter(<CsvImportPage />);
    await upload(CSV);
    expect(await screen.findByText(/No saved format matches this file/)).toBeInTheDocument();
    expect(screen.getByLabelText("Map column Merchant")).toBeInTheDocument();
    expect(screen.getByText("Map a Total column.")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Import",
    })).toBeDisabled();
  });
});
