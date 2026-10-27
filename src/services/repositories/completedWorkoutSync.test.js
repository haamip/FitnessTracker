import { describe, expect, it } from "vitest";
import {
  workoutHistoryCacheKey, pendingWorkoutIdsKey, mergeCompletedWorkouts,
  toCompletedWorkout, toCompletedWorkoutPayload,
} from "./completedWorkoutSync";

const user1 = "11111111-1111-4111-8111-111111111111";
const user2 = "22222222-2222-4222-8222-222222222222";

describe("completed workouts cloud reconciliation", () => {
  it("keeps each account in its own local cache and never adopts unowned legacy records", () => {
    expect(workoutHistoryCacheKey(user1)).not.toBe(workoutHistoryCacheKey(user2));
    expect(pendingWorkoutIdsKey(user1)).toContain(user1);
    expect(() => workoutHistoryCacheKey(null)).toThrow(/Sign in/);
  });
  it("preserves unsynced workouts instead of replacing them on cloud refresh", () => {
    const remote = [{ id: "synced", completedAt: "2026-10-26T10:00:00Z", volume: 200 }];
    const pending = [{ id: "local", completedAt: "2026-10-27T10:00:00Z", volume: 500 }];
    const merged = mergeCompletedWorkouts(remote, pending, ["local"]);
    expect(merged.map(x => x.id)).toEqual(["local", "synced"]);
    expect(mergeCompletedWorkouts([{ ...pending[0], volume: 600 }], pending, ["local"])[0].volume).toBe(500);
    expect(mergeCompletedWorkouts([{ ...pending[0], volume: 600 }], pending, [])[0].volume).toBe(600);
  });
  it("uses the same stable local id for idempotent cloud upserts", () => {
    const record = { id: "local-123", completedAt: "2026-10-27T08:00:00Z", seconds: 1800, volume: 300, exercises: [] };
    const p = toCompletedWorkoutPayload(record, user1);
    expect(p).toMatchObject({ user_id: user1, local_id: "local-123", status: "completed", duration_seconds: 1800 });
    expect(p.started_at).toBe("2026-10-27T07:30:00.000Z");
    expect(toCompletedWorkout({ id: "cloud-1", local_id: "local-123", title: "Gym", completed_at: record.completedAt }).id).toBe("local-123");
  });
});
