import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BottomNav from "./BottomNav";
import DailyCheckInGate from "../auth/DailyCheckInGate";

afterEach(cleanup);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DailyCheckInGate><BottomNav /></DailyCheckInGate>
    </MemoryRouter>,
  );
}

describe("TrackFit navigation", () => {
  it("shows five functional, named primary destinations", () => {
    renderAt("/");
    const links = within(screen.getByRole("navigation", { name: "Primary navigation" })).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/", "/workouts", "/cardio", "/nutrition", "/progress"]);
    expect(links.map((link) => link.textContent)).toEqual(["Home", "Train", "Cardio", "Food", "Progress"]);
  });

  it.each([
    ["/", "Home"],
    ["/dashboard", "Home"],
    ["/coach/intelligence", "Home"],
    ["/workouts", "Train"],
    ["/workouts/builder", "Train"],
    ["/exercises/example", "Train"],
    ["/plan", "Train"],
    ["/cardio", "Cardio"],
    ["/nutrition/scan", "Food"],
    ["/progress", "Progress"],
  ])("highlights the correct tab on %s", (path, label) => {
    renderAt(path);
    const current = screen.getByRole("link", { name: label });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("does not block navigation behind a mandatory check-in", () => {
    renderAt("/nutrition");
    expect(screen.getByRole("link", { name: "Food" })).toHaveAttribute("href", "/nutrition");
    expect(screen.queryByText("Loading TrackFit...")).not.toBeInTheDocument();
  });
});
