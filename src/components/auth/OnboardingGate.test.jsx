import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../services/supabase", () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
}));

import { supabase } from "../../services/supabase";
import OnboardingGate from "./OnboardingGate";

const member = { id: "member-id", email: "member@example.com", user_metadata: { display_name: "Tester" } };

function setupProfile(profile, writeError = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: writeError }),
  };
  supabase.from.mockReturnValue(query);
  return query;
}

describe("TrackFit first-login goals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({ data: { user: member }, error: null });
  });

  it("does not interrupt someone whose onboarding is already complete", async () => {
    setupProfile({ onboarding_complete: true });
    render(<OnboardingGate><div>My coaching dashboard</div></OnboardingGate>);
    expect(await screen.findByText("My coaching dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Let's make it yours.")).not.toBeInTheDocument();
  });

  it("prompts a new member for goals and saves them before allowing navigation", async () => {
    const query = setupProfile({ onboarding_complete: false, display_name: "Tester" });
    render(<OnboardingGate><div>My coaching dashboard</div></OnboardingGate>);
    expect(await screen.findByText("Let's make it yours.")).toBeInTheDocument();
    expect(screen.queryByText("My coaching dashboard")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/starting weight/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/goal weight/i), { target: { value: "95" } });
    fireEvent.click(screen.getByRole("button", { name: /save goals & start trackfit/i }));

    await waitFor(() => expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: member.id,
      onboarding_complete: true,
      starting_weight_kg: 100,
      goal_weight_kg: 95,
    }), { onConflict: "id" }));
    expect(await screen.findByText("My coaching dashboard")).toBeInTheDocument();
  });

  it("never dismisses setup if Supabase fails to save the goals", async () => {
    setupProfile({ onboarding_complete: false, display_name: "Tester" }, { message: "Save failed" });
    render(<OnboardingGate><div>My coaching dashboard</div></OnboardingGate>);
    await screen.findByText("Let's make it yours.");
    fireEvent.click(screen.getByRole("button", { name: /save goals & start trackfit/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
    expect(screen.queryByText("My coaching dashboard")).not.toBeInTheDocument();
  });
});
