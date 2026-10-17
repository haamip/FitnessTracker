import { describe, expect, it } from "vitest";
import { normaliseFreeExercise } from "./freeExerciseCatalog";

describe("free exercise catalog adapter", () => {
  it("normalises public-domain data to a TrackFit exercise", () => {
    const result = normaliseFreeExercise({
      id: "Alternate_Hammer_Curl",
      name: "Alternate Hammer Curl",
      equipment: "dumbbell",
      primaryMuscles: ["biceps"],
      secondaryMuscles: ["forearms"],
      instructions: ["Stand upright", "Curl the dumbbell"],
      images: ["Alternate_Hammer_Curl/0.jpg"],
      category: "strength",
    });
    expect(result).toMatchObject({
      id: "free-db-Alternate_Hammer_Curl",
      name: "Alternate Hammer Curl",
      equipment: ["dumbbell"],
      primaryMuscles: ["biceps"],
      defaultSets: 3,
      defaultReps: "8-12",
      source: "free-exercise-db",
    });
    expect(result.image).toContain("/Alternate_Hammer_Curl/0.jpg");
  });

  it("rejects invalid records and paths", () => {
    expect(normaliseFreeExercise({ name: "No ID" })).toBeNull();
    const result = normaliseFreeExercise({
      id: "safe",
      name: "Safe",
      images: ["../../other-site/photo.jpg"],
    });
    expect(result.image).toBe("");
    expect(result.equipment).toEqual(["body only"]);
  });
});
