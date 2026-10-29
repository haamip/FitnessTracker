import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/repositories/trackfitDataLayer", () => ({
  AIPlanRepository: { getPlan: vi.fn(), deletePlan: vi.fn() },
  WorkoutRepository: { removeById: vi.fn() },
}));
import { AIPlanRepository, WorkoutRepository } from "../services/repositories/trackfitDataLayer";
import PlanSetup from "./PlanSetup";

const plan = [
  { id:"ai-1", name:"Upper A", focus:"muscle", time:"60", exercises:[{name:"Bench press"}] },
  { id:"ai-2", name:"Lower A", focus:"muscle", time:"60", exercises:[{name:"Squat"}] },
];

function show() { return render(<MemoryRouter><PlanSetup /></MemoryRouter>); }
afterEach(() => vi.restoreAllMocks());

describe("active training plan screen", () => {
  it("shows a real saved split and route to each workout", () => {
    AIPlanRepository.getPlan.mockReturnValue(plan);
    show();
    expect(screen.getByRole("heading", { name:"Your training plan" })).toBeInTheDocument();
    expect(screen.getByText(/2-day training plan/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name:/Day 1: Upper A/ })).toHaveAttribute("href","/workouts/ai-1");
    expect(screen.getByRole("link", { name:/Day 2: Lower A/ })).toHaveAttribute("href","/workouts/ai-2");
  });

  it("deletes only the active plan and its unfinished drafts, without touching history", async () => {
    AIPlanRepository.getPlan.mockReturnValue(plan);
    AIPlanRepository.deletePlan.mockResolvedValue(undefined);
    vi.spyOn(window,"confirm").mockReturnValue(true);
    show();
    fireEvent.click(screen.getByRole("button", { name:/Delete entire training plan/ }));
    await waitFor(() => expect(screen.getByText("No training plan saved yet")).toBeInTheDocument());
    expect(AIPlanRepository.deletePlan).toHaveBeenCalledTimes(1);
    expect(WorkoutRepository.removeById).toHaveBeenCalledTimes(2);
    expect(WorkoutRepository.removeById).toHaveBeenCalledWith("ai-1");
    expect(WorkoutRepository.removeById).toHaveBeenCalledWith("ai-2");
  });

  it("keeps a plan if the cloud rejects deletion", async () => {
    AIPlanRepository.getPlan.mockReturnValue(plan);
    AIPlanRepository.deletePlan.mockRejectedValue(new Error("Network unavailable"));
    vi.spyOn(window,"confirm").mockReturnValue(true);
    show();
    fireEvent.click(screen.getByRole("button", { name:/Delete entire training plan/ }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/Network unavailable/));
    expect(screen.getByText(/2-day training plan/)).toBeInTheDocument();
    expect(WorkoutRepository.removeById).not.toHaveBeenCalled();
  });
});
