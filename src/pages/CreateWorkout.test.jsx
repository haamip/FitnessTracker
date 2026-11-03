import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/repositories/trackfitDataLayer", () => ({
  SavedWorkoutRepository: {
    getById: vi.fn(),
    save: vi.fn(),
    createSession: vi.fn(),
  },
  HistoryRepository: {
    getActiveUser: vi.fn(() => "tester-1"),
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

import { HistoryRepository, SavedWorkoutRepository } from "../services/repositories/trackfitDataLayer";
import CreateWorkout from "./CreateWorkout";

function mountBuilder(route = "/workouts/create") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CreateWorkout />
    </MemoryRouter>,
  );
}

function renderBuilder() {
  mountBuilder();
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
    window.localStorage.clear();
    HistoryRepository.getActiveUser.mockReturnValue("tester-1");
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

describe("workout builder draft recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    HistoryRepository.getActiveUser.mockReturnValue("tester-1");
  });

  it("restores name, selected exercises, sets and reps after the tab is recreated", () => {
    const first = mountBuilder();
    fireEvent.change(screen.getByRole("textbox", { name: "Workout name" }), {
      target: { value: "Chest after work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add exercise from library/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select test exercise" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sets for Barbell Bench Press" }), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Reps for Barbell Bench Press" }), {
      target: { value: "6-10" },
    });
    first.unmount();

    mountBuilder();
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("Chest after work");
    expect(screen.getByRole("spinbutton", { name: "Sets for Barbell Bench Press" })).toHaveValue(5);
    expect(screen.getByRole("textbox", { name: "Reps for Barbell Bench Press" })).toHaveValue("6-10");
    expect(screen.getByRole("status")).toHaveTextContent("Recovered your unfinished workout");
  });

  it("clears a draft only after saving the complete workout", () => {
    const first = mountBuilder();
    fireEvent.change(screen.getByRole("textbox", { name: "Workout name" }), {
      target: { value: "Ready to save" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add exercise from library/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select test exercise" }));
    first.unmount();

    const restored = mountBuilder();
    expect(screen.getByRole("status")).toHaveTextContent("Recovered");
    fireEvent.click(screen.getByRole("button", { name: /^save workout$/i }));
    expect(SavedWorkoutRepository.save).toHaveBeenCalledOnce();
    restored.unmount();

    mountBuilder();
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("");
    expect(screen.queryByRole("spinbutton", { name: "Sets for Barbell Bench Press" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps unfinished workouts private to each logged-in account on a device", () => {
    const first = mountBuilder();
    fireEvent.change(screen.getByRole("textbox", { name: "Workout name" }), {
      target: { value: "Tester one's workout" },
    });
    first.unmount();

    HistoryRepository.getActiveUser.mockReturnValue("tester-2");
    const second = mountBuilder();
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("");
    second.unmount();

    HistoryRepository.getActiveUser.mockReturnValue("tester-1");
    mountBuilder();
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("Tester one's workout");
  });

  it("lets users discard an interrupted workout without restoring it later", () => {
    const first = mountBuilder();
    fireEvent.change(screen.getByRole("textbox", { name: "Workout name" }), {
      target: { value: "Discard me" },
    });
    first.unmount();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const restored = mountBuilder();
    fireEvent.click(screen.getByRole("button", { name: "Discard draft" }));
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("");
    restored.unmount();

    mountBuilder();
    expect(screen.getByRole("textbox", { name: "Workout name" })).toHaveValue("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
