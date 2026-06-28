import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("TrackFit app shell", () => {
  it("renders the dashboard landing page", () => {
    render(<App />);

    expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Haami/i })).toBeInTheDocument();
    expect(screen.getByText(/TrackFit level/i)).toBeInTheDocument();
  });
});
