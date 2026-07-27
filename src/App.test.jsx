import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./components/auth/AuthGate", () => ({
  default: ({ children }) => children,
}));

vi.mock("./components/auth/DailyCheckInGate", () => ({
  default: ({ children }) => children,
}));

import App from "./App";

describe("TrackFit app shell", () => {
  it("renders the mobile app shell while lazy routes load", () => {
    render(<App />);

    expect(screen.getByText("TrackFit")).toBeInTheDocument();
    expect(screen.getByText("Built to move")).toBeInTheDocument();
    expect(screen.getByText(/Loading TrackFit/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Train/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /food/i })).toBeInTheDocument();
  });
});
