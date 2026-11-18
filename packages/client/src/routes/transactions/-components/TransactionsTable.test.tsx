import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionsTable } from "./TransactionsTable";

import { makeTransaction } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TransactionsTable", () => {
  it("lists transactions with their payee and account names", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([makeTransaction({
      name: "CORNER BAKERY #12",
      payeeName: "CORNER BAKERY",
      accountName: "Everyday Card",
    })])));
    await renderWithRouter(<TransactionsTable />);
    expect(await screen.findByText("CORNER BAKERY #12")).toBeInTheDocument();
    expect(screen.getByText("CORNER BAKERY")).toBeInTheDocument();
    expect(screen.getByText("Everyday Card")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    await renderWithRouter(<TransactionsTable />);
    expect(await screen.findByText(/No transactions yet/)).toBeInTheDocument();
  });
});
