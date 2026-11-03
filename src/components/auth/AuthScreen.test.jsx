import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../services/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

import { supabase } from "../../services/supabase";
import AuthScreen from "./AuthScreen";

function openSignup() {
  fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
}

function fillSignup(password, confirmation = password) {
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "tester@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: confirmation } });
}

describe("TrackFit account password setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "test-id" } }, error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  });

  it("shows a sign-up checklist and confirm-password field", () => {
    render(<AuthScreen />);
    openSignup();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("One uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("One lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("One number")).toBeInTheDocument();
    expect(screen.getByText("One special character")).toBeInTheDocument();
  });

  it("lets users show and hide each password independently", () => {
    render(<AuthScreen />);
    openSignup();
    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Confirm password");
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show confirmation password" }));
    expect(confirmation).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("rejects weak sign-up passwords before contacting Supabase", () => {
    render(<AuthScreen />);
    openSignup();
    fillSignup("password123");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form"));
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
    expect(screen.getByText(/meet all the password requirements/i)).toBeInTheDocument();
  });

  it("rejects mismatched confirmation before contacting Supabase", () => {
    render(<AuthScreen />);
    openSignup();
    fillSignup("StrongPass1!", "StrongPass2!");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form"));
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
    expect(screen.getByText(/your passwords don't match/i)).toBeInTheDocument();
  });

  it("submits only the actual password once the requirements match", async () => {
    render(<AuthScreen />);
    openSignup();
    fillSignup("StrongPass1!");
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form"));
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "tester@example.com",
        password: "StrongPass1!",
        options: { emailRedirectTo: window.location.origin },
      });
    });
  });

  it("keeps existing-account login working without imposing new registration rules", async () => {
    render(<AuthScreen />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "existing@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "oldpass" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form"));
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "existing@example.com",
        password: "oldpass",
      });
    });
  });
});
