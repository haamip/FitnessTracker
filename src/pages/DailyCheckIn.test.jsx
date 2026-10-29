import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
vi.mock("../services/repositories/trackfitDataLayer", () => ({
  CheckInRepository: {
    getAll: vi.fn(() => []),
    getLegacyCount: vi.fn(() => 0),
    saveAll: vi.fn(),
    saveStepsFromWatch: vi.fn(),
  },
}));
vi.mock("../services/wearableBridge", () => ({
  getWearableBridge: vi.fn(() => null),
  readWearableSteps: vi.fn(),
}));
vi.mock("../services/watchConnectionStatus", () => ({
  isTrackFitNativeApp: vi.fn(() => false),
  inspectWatchConnection: vi.fn(),
}));
vi.mock("../features/gamification/gamification", () => ({
  completeDailyCheckIn: vi.fn(),
}));
import { CheckInRepository } from "../services/repositories/trackfitDataLayer";
import DailyCheckIn from "./DailyCheckIn";

afterEach(() => vi.restoreAllMocks());

describe("daily check-in save and feedback", () => {
  it("saves today's answers and confirms the entry is recorded", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "mock-checkin-id" });
    CheckInRepository.getAll.mockReturnValue([]);
    CheckInRepository.saveAll.mockResolvedValue({ cloudSaved:true });
    render(<MemoryRouter><DailyCheckIn/></MemoryRouter>);
    fireEvent.click(screen.getByRole("button",{name:"Good"}));
    fireEvent.click(screen.getByRole("button",{name:"Workout",exact:true}));
    fireEvent.click(screen.getByRole("button",{name:"Save daily check-in"}));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/backed up to your account/));
    expect(CheckInRepository.saveAll).toHaveBeenCalledOnce();
    expect(screen.getByText("Today's check-in is recorded")).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Update today's check-in"})).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
