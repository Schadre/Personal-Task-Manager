import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskTable from "./TaskTable";
import { updateTask, deleteTask } from "../services/api";

jest.mock("../services/api");

const mockTasks = [
  {
    id: 1,
    title: "Task One",
    description: "Desc1",
    due_date: "2025-12-31",
    priority: "high",
    category: "Work",
    status: "pending",
  },
  {
    id: 2,
    title: "Task Two",
    description: null,
    due_date: null,
    priority: "medium",
    category: null,
    status: "completed",
  },
];

const mockReload = jest.fn();
const mockOnEditTask = jest.fn();

describe("TaskTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all tasks with formatted due date and badges", () => {
    render(
      <TaskTable
        tasks={mockTasks}
        reload={mockReload}
        onEditTask={mockOnEditTask}
      />,
    );

    // Both desktop table and mobile cards contain the task titles
    expect(screen.getAllByText("Task One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Task Two").length).toBeGreaterThan(0);

    // Category appears in both views as well
    expect(screen.getAllByText("Work").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Uncategorized").length).toBeGreaterThan(0);

    // Due date placeholder "—" appears twice (once in desktop, once in mobile for task 2)
    expect(screen.getAllByText("—").length).toBe(2);

    // Priority badges appear in both views
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Medium").length).toBeGreaterThan(0);

    // "Overdue" badge appears in both views for task 1
    expect(screen.getAllByText("Overdue").length).toBeGreaterThan(0);

    // "Completed" status appears in both views for task 2
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  test("toggle complete: marks pending task as completed", async () => {
    updateTask.mockResolvedValueOnce({});
    render(
      <TaskTable
        tasks={mockTasks}
        reload={mockReload}
        onEditTask={mockOnEditTask}
      />,
    );
    const toggleButtons = screen.getAllByLabelText("Toggle complete");
    // First button corresponds to Task One (pending)
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(1, { status: "completed" });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("toggle complete: marks completed task as pending", async () => {
    updateTask.mockResolvedValueOnce({});
    render(
      <TaskTable
        tasks={mockTasks}
        reload={mockReload}
        onEditTask={mockOnEditTask}
      />,
    );
    const toggleButtons = screen.getAllByLabelText("Toggle complete");
    // Second button corresponds to Task Two (completed)
    fireEvent.click(toggleButtons[1]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(2, { status: "pending" });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("calls deleteTask and reload when delete button clicked and confirm OK", async () => {
    window.confirm = jest.fn(() => true);
    deleteTask.mockResolvedValueOnce({});
    render(
      <TaskTable
        tasks={mockTasks}
        reload={mockReload}
        onEditTask={mockOnEditTask}
      />,
    );
    const deleteButtons = screen.getAllByLabelText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith(1);
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("does not delete when confirm is cancelled", async () => {
    window.confirm = jest.fn(() => false);
    render(
      <TaskTable
        tasks={mockTasks}
        reload={mockReload}
        onEditTask={mockOnEditTask}
      />,
    );
    const deleteButtons = screen.getAllByLabelText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(deleteTask).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });
});
