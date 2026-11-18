import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountsManager } from "./AccountsManager";

import { makeAccount, makeEntity } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccountsManager", () => {
  it("lists accounts with their institution and owner", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/accounts")) {
        return Response.json([makeAccount({
          name: "Everyday Card",
          institutionName: "Globex Credit Union",
          ownerName: "Pat",
        })]);
      }
      return Response.json([makeEntity()]);
    }));
    await renderWithRouter(<AccountsManager />);
    expect(await screen.findByLabelText("Name of Everyday Card")).toBeInTheDocument();
    expect(screen.getByText("Globex Credit Union")).toBeInTheDocument();
    expect(screen.getByText("Pat")).toBeInTheDocument();
  });
});
