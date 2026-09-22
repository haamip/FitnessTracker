import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("./components/auth/AuthGate", () => ({
  default: ({ children }) => children,
}));

vi.mock("./components/auth/DailyCheckInGate", () => ({
  default: ({ children }) => children,
}));

import App from "./App";

describe("TrackFit app shell", () => {
  it("renders the new brand, accessible menu and five named navigation links", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "TrackFit home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("TRAINING, SIMPLIFIED.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open all pages and account menu" })).toHaveAttribute("aria-expanded", "false");
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Train" })).toHaveAttribute("href", "/workouts");
    expect(within(nav).getByRole("link", { name: "Food" })).toHaveAttribute("href", "/nutrition");
  });
});
