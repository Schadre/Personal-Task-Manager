import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskTable from "./TaskTable";

jest.mock("../services/api", () => ({
  updateTask: jest.fn().mockResolvedValue({}),
  deleteTask: jest.fn().mockResolvedValue({}),
}));

import { updateTask, deleteTask } from "../services/api";

describe("TaskTable", () => {
  const mockTasks = [
    { id: 1, title: "Task One", due_date: "2025-12-31", status: "pending" },
    { id: 2, title: "Task Two", due_date: "2025-12-30", status: "pending" },
  ];
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all tasks", () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    expect(screen.getByText("Task One")).toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
    expect(screen.getByText("2025-12-31")).toBeInTheDocument();
  });

  test("calls updateTask and reload when complete button clicked", async () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const completeButtons = screen.getAllByText("✓");
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(1, { status: "completed" });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("calls deleteTask and reload when delete button clicked", async () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const deleteButtons = screen.getAllByText("🗑");
    fireEvent.click(deleteButtons[1]);

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith(2);
      expect(mockReload).toHaveBeenCalled();
    });
  });
});
