import { describe, it, expect, beforeEach, vi } from "vitest";

// use vi.hoisted to avoid hoist issues with mocks
const { mockPost, mockSetAuthToken } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockSetAuthToken: vi.fn(),
}));

vi.mock("../api", () => ({
  __esModule: true,
  default: { post: mockPost },
  setAuthToken: mockSetAuthToken,
}));

import { login, register, logout, isAuthed } from "../auth";

describe("auth helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPost.mockReset();
    mockSetAuthToken.mockReset();
  });

  it("login stores tokens and sets Authorization", async () => {
    mockPost.mockResolvedValue({ data: { access: "a1", refresh: "r1" } });
    await login("user", "pw");
    expect(localStorage.getItem("access")).toBe("a1");
    expect(localStorage.getItem("refresh")).toBe("r1");
    expect(mockSetAuthToken).toHaveBeenCalledWith("a1");
    expect(mockPost).toHaveBeenCalledWith("/api/auth/token/", { username: "user", password: "pw" });
  });

  it("register calls register endpoint then login", async () => {
    mockPost
      .mockResolvedValueOnce({ data: {} }) // register
      .mockResolvedValueOnce({ data: { access: "ax", refresh: "rx" } }); // login
    await register("nu", "pw");
    expect(mockPost).toHaveBeenNthCalledWith(1, "/api/auth/register/", { username: "nu", password: "pw" });
    expect(mockPost).toHaveBeenNthCalledWith(2, "/api/auth/token/", { username: "nu", password: "pw" });
    expect(localStorage.getItem("access")).toBe("ax");
    expect(mockSetAuthToken).toHaveBeenCalledWith("ax");
  });

  it("logout clears stored tokens and header", () => {
    localStorage.setItem("access", "a1");
    localStorage.setItem("refresh", "r1");
    logout();
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(mockSetAuthToken).toHaveBeenCalledWith(null);
  });

  it("isAuthed reflects stored access token", () => {
    expect(isAuthed()).toBe(false);
    localStorage.setItem("access", "token");
    expect(isAuthed()).toBe(true);
  });
});
