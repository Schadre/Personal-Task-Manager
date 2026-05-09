import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddTaskModal from "./AddTaskModal";
import { createTask } from "../services/api";

jest.mock("../services/api");

describe("AddTaskModal", () => {
  const mockOnClose = jest.fn();
  const mockOnTaskAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders when open", () => {
    render(
      <AddTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onTaskAdded={mockOnTaskAdded}
      />,
    );
    expect(screen.getByText("Add New Task")).toBeInTheDocument();
    expect(screen.getByLabelText("Title *")).toBeInTheDocument();
  });

  test("saves task with all fields and calls onTaskAdded & onClose", async () => {
    createTask.mockResolvedValueOnce({});
    render(
      <AddTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onTaskAdded={mockOnTaskAdded}
      />,
    );

    await userEvent.type(screen.getByLabelText("Title *"), "Finish report");
    await userEvent.type(
      screen.getByLabelText("Description"),
      "Complete the capstone writeup",
    );
    await userEvent.type(screen.getByLabelText("Due Date"), "2025-12-31");
    await userEvent.selectOptions(screen.getByLabelText("Priority"), "high");
    await userEvent.type(screen.getByLabelText("Category"), "School");

    fireEvent.click(screen.getByText("Create Task"));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Finish report",
          description: "Complete the capstone writeup",
          due_date: "2025-12-31T00:00:00.000Z",
          priority: "high",
          category: "School",
        }),
      );
      expect(mockOnTaskAdded).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("saves task with only required fields", async () => {
    createTask.mockResolvedValueOnce({});
    render(
      <AddTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onTaskAdded={mockOnTaskAdded}
      />,
    );

    await userEvent.type(screen.getByLabelText("Title *"), "Quick task");
    fireEvent.click(screen.getByText("Create Task"));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Quick task",
          description: null,
          due_date: null,
          priority: "medium",
          category: "Uncategorized",
        }),
      );
      expect(mockOnTaskAdded).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("shows validation error when title is empty", async () => {
    render(
      <AddTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onTaskAdded={mockOnTaskAdded}
      />,
    );
    fireEvent.click(screen.getByText("Create Task"));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });
});
