import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/repositories/trackfitDataLayer", () => ({
  SavedWorkoutRepository: {
    getById: vi.fn(),
    save: vi.fn(),
    createSession: vi.fn(),
  },
}));

vi.mock("../components/ExercisePicker", () => ({
  default: ({ isOpen, onSelectExercise }) => isOpen ? (
    <button type="button" onClick={() => onSelectExercise({
      id: "bench-press",
      name: "Barbell Bench Press",
      defaultSets: 3,
      defaultReps: "8-12",
    })}>Select test exercise</button>
  ) : null,
}));

import { SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import CreateWorkout from "./CreateWorkout";

function renderBuilder() {
  render(
    <MemoryRouter initialEntries={["/workouts/create"]}>
      <CreateWorkout />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Workout name" }), {
    target: { value: "My workout" },
  });
  fireEvent.click(screen.getByRole("button", { name: /add exercise from library/i }));
  fireEvent.click(screen.getByRole("button", { name: "Select test exercise" }));
  return screen.getByRole("spinbutton", { name: "Sets for Barbell Bench Press" });
}

describe("workout builder set count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets mobile users delete the starting 3 and enter 4 sets before saving", () => {
    const input = renderBuilder();
    expect(input).toHaveValue(3);
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(null);
    fireEvent.change(input, { target: { value: "4" } });
    expect(input).toHaveValue(4);
    fireEvent.blur(input);
    expect(input).toHaveValue(4);
    fireEvent.click(screen.getByRole("button", { name: /^save workout$/i }));
    expect(SavedWorkoutRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My workout",
        exercises: [
          expect.objectContaining({
            sets: expect.arrayContaining([expect.objectContaining({ reps: "8-12" })]),
          }),
        ],
      }),
    );
    const saved = SavedWorkoutRepository.save.mock.calls[0][0];
    expect(saved.exercises[0].sets).toHaveLength(4);
    expect(saved.exercises[0].target).toBe("4 sets - 8-12 reps");
  });

  it("reverts invalid counts without losing the last valid sets", () => {
    const input = renderBuilder();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(3);
    fireEvent.change(input, { target: { value: "31" } });
    expect(input).toHaveValue(31);
    fireEvent.blur(input);
    expect(input).toHaveValue(3);
  });

  it("updates rep targets after changing the number of sets", () => {
    const input = renderBuilder();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    fireEvent.change(screen.getByRole("textbox", { name: "Reps for Barbell Bench Press" }), {
      target: { value: "6-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save workout$/i }));
    const saved = SavedWorkoutRepository.save.mock.calls[0][0];
    expect(saved.exercises[0].sets).toHaveLength(5);
    expect(saved.exercises[0].sets.every((set) => set.reps === "6-10")).toBe(true);
  });
});
