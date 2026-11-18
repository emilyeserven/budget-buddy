import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "./HomePage";

import { APP_PAGES } from "@/lib/pages";
import { renderWithRouter } from "@/test-utils/router";

describe("HomePage", () => {
  it("links a tile to every main page", async () => {
    await renderWithRouter(<HomePage />, {
      paths: APP_PAGES.map(page => page.to),
    });
    for (const page of APP_PAGES) {
      expect(screen.getByRole("link", {
        name: new RegExp(page.label),
      })).toHaveAttribute("href", page.to);
    }
  });
});
