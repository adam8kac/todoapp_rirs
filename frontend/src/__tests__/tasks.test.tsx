import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Tasks from "../components/Tasks";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

type MockTask = {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  created_by_username?: string;
  assigned_to_id?: number | null;
  assigned_to_username?: string | null;
};

type MockUser = { id: number; username: string };

vi.mock("../api", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

describe("Tasks component", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockDelete.mockReset();
  });

  function setupLoad(tasks: MockTask[] = [], users: MockUser[] = []) {
    mockGet.mockImplementation((url: string) => {
      if (url === "/api/tasks/") return Promise.resolve({ data: tasks });
      if (url === "/api/users/") return Promise.resolve({ data: users });
      return Promise.resolve({ data: [] });
    });
  }

  it("loads and renders tasks", async () => {
    setupLoad(
      [{ id: "1", title: "First", done: false, due_date: null }],
      [{ id: 1, username: "u1" }]
    );
    render(<Tasks />);
    await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());
  });

  it("adds a task and reloads list", async () => {
    setupLoad([], []);
    mockPost.mockResolvedValue({ data: { id: "2" } });
    // after add, load again returns new task
    mockGet.mockImplementationOnce((url: string) => Promise.resolve({ data: [] }))
      .mockImplementationOnce((url: string) => Promise.resolve({ data: [] }))
      .mockImplementation((url: string) => {
        if (url === "/api/tasks/") return Promise.resolve({ data: [{ id: "2", title: "New", done: false, due_date: null }] });
        if (url === "/api/users/") return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

    render(<Tasks />);
    const input = screen.getByPlaceholderText("Dodaj novo opravilo…");
    fireEvent.change(input, { target: { value: "New" } });
    fireEvent.click(screen.getByText("Dodaj"));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/api/tasks/", expect.any(Object)));
    await waitFor(() => expect(screen.getByText("New")).toBeInTheDocument());
  });

  it("toggles done state optimistically", async () => {
    setupLoad([{ id: "1", title: "Do it", done: false, due_date: null }], []);
    mockPost.mockResolvedValue({ data: {} });
    render(<Tasks />);
    await waitFor(() => expect(screen.getByText("Do it")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /označi/i }));
    expect(mockPost).toHaveBeenCalledWith("/api/tasks/1/toggle/");
  });

  it("deletes task and updates UI", async () => {
    setupLoad([{ id: "1", title: "Remove me", done: false, due_date: null }], []);
    mockDelete.mockResolvedValue({ data: {} });
    render(<Tasks />);
    await waitFor(() => expect(screen.getByText("Remove me")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Izbriši"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/api/tasks/1/"));
  });
});
