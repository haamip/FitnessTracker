import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../supabase", () => ({ supabase: null }));
import { HistoryRepository } from "./trackfitDataLayer";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const example = { id: "workout-first", title: "Chest", completedAt: "2026-10-27T07:00:00Z", seconds: 1200, volume: 300 };

describe("completed workout repository account isolation and offline queue", () => {
  beforeEach(() => { localStorage.clear(); HistoryRepository.setActiveUser(alice); });
  afterEach(() => HistoryRepository.setActiveUser(null));

  it("keeps an offline workout pending and visible after switching accounts", () => {
    HistoryRepository.add(example);
    expect(HistoryRepository.getAll()).toHaveLength(1);
    expect(HistoryRepository.getPendingIds()).toEqual(["workout-first"]);
    HistoryRepository.setActiveUser(bob);
    expect(HistoryRepository.getAll()).toEqual([]);
    expect(HistoryRepository.getPendingIds()).toEqual([]);
    HistoryRepository.setActiveUser(alice);
    expect(HistoryRepository.getAll()[0]).toMatchObject(example);
    expect(HistoryRepository.getPendingIds()).toEqual(["workout-first"]);
  });

  it("does not automatically expose legacy unowned workouts to another login", () => {
    localStorage.setItem("trackfit_workout_history", JSON.stringify([example]));
    expect(HistoryRepository.getAll()).toEqual([]);
    expect(HistoryRepository.getLegacyCount()).toBe(1);
    expect(HistoryRepository.importLegacyForCurrentUser()).toBe(1);
    expect(HistoryRepository.getAll()[0].id).toBe(example.id);
    expect(HistoryRepository.getPendingIds()).toEqual([example.id]);
    HistoryRepository.setActiveUser(bob);
    expect(HistoryRepository.getAll()).toEqual([]);
    expect(HistoryRepository.getLegacyCount()).toBe(0);
    expect(JSON.parse(localStorage.getItem("trackfit_workout_history"))).toEqual([example]);
  });

  it("marks an edited duration for another attempt", () => {
    HistoryRepository.add(example);
    const updated = HistoryRepository.update(example.id, { seconds: 1800 });
    expect(updated.seconds).toBe(1800);
    expect(HistoryRepository.getPendingIds()).toContain(example.id);
  });
});
