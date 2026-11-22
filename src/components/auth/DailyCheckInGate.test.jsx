import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DailyCheckInGate from "./DailyCheckInGate";

vi.mock("../../services/repositories/trackfitDataLayer", () => ({
  CheckInRepository: {
    getActiveUser: vi.fn(() => "tester-1"),
    getAll: vi.fn(() => []),
  },
}));
vi.mock("../../services/shift/shiftModeService", () => ({
  getOperationalDate: vi.fn(() => "2026-11-22"),
  SHIFT_MODE_EVENT: "trackfit:shift-mode-changed",
}));
import { CheckInRepository } from "../../services/repositories/trackfitDataLayer";

function mount(path = "/") {
  return render(<MemoryRouter initialEntries={[path]}><DailyCheckInGate>
    <Routes><Route path="/" element={<p>Coach home</p>}/><Route path="/checkin" element={<p>Check-in form</p>}/></Routes>
  </DailyCheckInGate></MemoryRouter>);
}
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { localStorage.clear(); });

describe("daily check-in reminder", () => {
  it("prompts when missing, then defers without blocking the app", () => {
    mount();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:"Remind me later"}));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Coach home")).toBeInTheDocument();
  });
  it("does not prompt when today's entry already exists", () => {
    CheckInRepository.getAll.mockReturnValueOnce([{date:"2026-11-22"}]);
    mount();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("does not interrupt the check-in page", () => {
    mount("/checkin");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
