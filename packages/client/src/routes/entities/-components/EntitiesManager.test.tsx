import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EntitiesManager } from "./EntitiesManager";

import { useNotificationStore } from "@/stores/notificationStore";
import { makeEntity } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

function stubApi(entities = [makeEntity({
  name: "Acme Bank",
})]) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") return Response.json(entities);
    if (method === "PATCH") return Response.json(entities[0]);
    return new Response(null, {
      status: 204,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EntitiesManager", () => {
  it("auto-saves a renamed entity on blur with a field-named toast", async () => {
    const fetchMock = stubApi();
    await renderWithRouter(<EntitiesManager />);
    const input = await screen.findByLabelText("Name of Acme Bank");
    fireEvent.change(input, {
      target: {
        value: "Acme Savings Bank",
      },
    });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/entities/entity-1", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Acme Savings Bank",
        }),
      }));
    });
    await waitFor(() => {
      expect(useNotificationStore.getState().notifications[0]?.message).toBe("Updated Name");
    });
  });

  it("doesn't save when the name is unchanged", async () => {
    const fetchMock = stubApi();
    await renderWithRouter(<EntitiesManager />);
    fireEvent.blur(await screen.findByLabelText("Name of Acme Bank"));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      method: "PATCH",
    }));
  });
});
