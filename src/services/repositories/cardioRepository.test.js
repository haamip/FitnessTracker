import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../supabase", () => ({ supabase: null }));
import { CardioRepository } from "./trackfitDataLayer";
import { CardioCloudRepository } from "./cardioCloudRepository";
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const row = { id: "cardio-33333333-3333-4333-8333-333333333333", date: "2026-10-27", type: "Treadmill", durationMin: 30 };

describe("cardio local-first account storage", () => {
  beforeEach(() => { localStorage.clear(); CardioRepository.setActiveUser(alice); });
  afterEach(() => CardioRepository.setActiveUser(null));

  it("keeps a new session safe for retry and separate from a second login", async () => {
    const saved = await CardioCloudRepository.add(row);
    expect(saved.cloudPending).toBe(true);
    expect(CardioRepository.getAll()).toHaveLength(1);
    expect(CardioCloudRepository.getPendingCount()).toBe(1);
    CardioRepository.setActiveUser(bob);
    expect(CardioRepository.getAll()).toEqual([]);
    CardioRepository.setActiveUser(alice);
    expect(CardioRepository.getAll()[0].id).toBe(row.id);
  });
  it("keeps offline deletion hidden during a cloud refresh", async () => {
    await CardioCloudRepository.add(row);
    await CardioCloudRepository.remove(row.id);
    expect(CardioRepository.getAll()).toEqual([]);
    expect(CardioRepository.getDeletions()).toContain("33333333-3333-4333-8333-333333333333");
    expect(CardioRepository.getPendingIds()).toEqual([]);
  });
  it("never automatically imports old unowned cardio entries", () => {
    localStorage.setItem("trackfit_cardio", JSON.stringify([row]));
    expect(CardioRepository.getAll()).toEqual([]);
    expect(CardioRepository.getLegacyCount()).toBe(1);
    expect(CardioRepository.importLegacyForCurrentUser()).toBe(1);
    expect(CardioRepository.getAll()).toHaveLength(1);
    CardioRepository.setActiveUser(bob);
    expect(CardioRepository.getAll()).toEqual([]);
  });
});
