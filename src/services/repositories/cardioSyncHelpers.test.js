import { describe, expect, it } from "vitest";
import { cardioCacheKey, cardioPendingKey, canonicalCardioId, mergeCloudCardio } from "./cardioSyncHelpers";
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";

describe("cardio sync integrity", () => {
  it("never uses a shared cache across accounts", () => {
    expect(cardioCacheKey(alice)).not.toBe(cardioCacheKey(bob));
    expect(cardioPendingKey(alice)).toContain(alice);
    expect(() => cardioCacheKey("")).toThrow(/signed-in/);
  });
  it("canonicalises the local cardio ID to an idempotent Postgres UUID", () => {
    expect(canonicalCardioId(`cardio-${id}`)).toBe(id);
    expect(canonicalCardioId(id)).toBe(id);
    expect(canonicalCardioId("random")).toBeNull();
  });
  it("merges cloud and offline records without duplicates or losing pending changes", () => {
    const remote = [{ id, date: "2026-10-27", durationMin: 30 }];
    const pending = [{ id: `cardio-${id}`, date: "2026-10-27", durationMin: 45 }];
    expect(mergeCloudCardio(remote, pending, [pending[0].id])).toEqual(pending);
    expect(mergeCloudCardio(remote, pending, [])).toEqual(remote);
    expect(mergeCloudCardio(remote, pending, [], [id])).toEqual([]);
  });
});
