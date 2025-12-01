import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

const mockLogout = vi.fn();
let authed = false;

vi.mock("../auth", () => ({
  __esModule: true,
  isAuthed: () => authed,
  logout: () => mockLogout(),
}));

// stub matchMedia for tests that check theme logic
beforeEach(() => {
  authed = false;
  mockLogout.mockReset();
  // @ts-ignore
  window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
  localStorage.clear();
  document.body.removeAttribute("data-theme");
});

function renderApp() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("App shell", () => {
  it("shows login/register links when not authenticated", () => {
    renderApp();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows tasks/logout when authenticated", () => {
    authed = true;
    renderApp();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Logout"));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("toggles theme and persists selection", () => {
    renderApp();
    const toggle = screen.getByRole("checkbox", { name: /toggle theme/i });
    expect(document.body.getAttribute("data-theme")).toBe("light");
    fireEvent.click(toggle);
    expect(document.body.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
