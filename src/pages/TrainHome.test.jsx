import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
vi.mock("../services/repositories/trackfitDataLayer",()=>({
  AIPlanRepository:{getPlan:vi.fn(()=>[])},
  HistoryRepository:{getRecent:vi.fn(()=>[])},
  SavedWorkoutRepository:{getAll:vi.fn(()=>[])},
}));
import TrainHome from "./TrainHome";
describe("Train navigation",()=>{
  it("shows a compact hub with separate plan, saved routines and history",()=>{
    render(<MemoryRouter><TrainHome/></MemoryRouter>);
    expect(screen.getByRole("heading",{name:"Ready to move?"})).toBeInTheDocument();
    expect(screen.getByRole("link",{name:/My training plan/})).toHaveAttribute("href","/plan");
    expect(screen.getByRole("link",{name:/My workouts/})).toHaveAttribute("href","/workouts/library");
    expect(screen.getByRole("link",{name:/Workout history/})).toHaveAttribute("href","/workouts/history");
    expect(screen.getByRole("link",{name:/Import workout/})).toHaveAttribute("href","/workouts/import");
  });
});
