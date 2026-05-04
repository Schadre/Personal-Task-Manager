import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddTaskModal from "./AddTaskModal";

jest.mock("../services/api", () => ({
  createTask: jest.fn().mockResolvedValue({}),
}));

import { createTask } from "../services/api";

describe("AddTaskModal", () => {
  const mockClose = jest.fn();
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all form fields", () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save task/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  test("shows error when title is empty and save is attempted", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);
    const saveButton = screen.getByRole("button", { name: /save task/i });
    fireEvent.click(saveButton);
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  test("clears error when user starts typing in title", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);
    const saveButton = screen.getByRole("button", { name: /save task/i });
    fireEvent.click(saveButton);
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: "New Task" } });
    expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
  });

  test("saves task with all fields and calls reload & close", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);

    const titleInput = screen.getByLabelText(/title/i);
    const descInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    const categoryInput = screen.getByLabelText(/category/i);
    const saveButton = screen.getByRole("button", { name: /save task/i });

    fireEvent.change(titleInput, { target: { value: "Finish report" } });
    fireEvent.change(descInput, {
      target: { value: "Complete the capstone writeup" },
    });
    fireEvent.change(dueDateInput, { target: { value: "2026-06-01" } });
    fireEvent.change(categoryInput, { target: { value: "Work" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        title: "Finish report",
        description: "Complete the capstone writeup",
        due_date: "2026-06-01",
        category: "Work",
      });
      expect(mockReload).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  test("saves task with only required fields (description, due date, category empty/null)", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);

    const titleInput = screen.getByLabelText(/title/i);
    const saveButton = screen.getByRole("button", { name: /save task/i });

    fireEvent.change(titleInput, { target: { value: "Quick task" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        title: "Quick task",
        description: "",
        due_date: null,
        category: "Uncategorized",
      });
      expect(mockReload).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  test("cancel closes modal without saving", () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(createTask).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
