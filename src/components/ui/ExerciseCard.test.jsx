import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ExerciseCard from "./ExerciseCard";

describe("text-first exercise cards", () => {
  it("shows the useful exercise details with no images or fallback tiles", () => {
    const onClick = vi.fn();
    const { container } = render(<ExerciseCard
      name="Dumbbell bench press" target="4 sets - 8 reps"
      sets={[{ done: true }, { done: false }, { done: false }, { done: false }]}
      image="/exercise-images/missing.svg"
      onClick={onClick}
    />);
    expect(screen.getByText("Dumbbell bench press")).toBeInTheDocument();
    expect(screen.getByText("4 sets - 8 reps")).toBeInTheDocument();
    expect(screen.getByText("1/4 sets complete")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".tf-exercise-fallback")).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
