import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskTable from "./TaskTable";

jest.mock("../services/api", () => ({
  updateTask: jest.fn().mockResolvedValue({}),
  deleteTask: jest.fn().mockResolvedValue({}),
}));

import { updateTask, deleteTask } from "../services/api";

describe("TaskTable", () => {
  const mockTasks = [
    {
      id: 1,
      title: "Task One",
      description: "Desc1",
      due_date: "2025-12-31",
      category: "Work",
      status: "pending",
    },
    {
      id: 2,
      title: "Task Two",
      due_date: "2025-12-30",
      category: "",
      status: "completed",
    },
  ];
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  test("renders all tasks with formatted due date and category", () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    expect(screen.getByText("Task One")).toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    const expectedDate1 = new Date("2025-12-31").toLocaleDateString();
    const expectedDate2 = new Date("2025-12-30").toLocaleDateString();
    expect(screen.getByText(expectedDate1)).toBeInTheDocument();
    expect(screen.getByText(expectedDate2)).toBeInTheDocument();
  });

  test("toggle complete: marks pending task as completed", async () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const completeButtons = screen.getAllByText("✓");
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(1, { status: "completed" });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("toggle complete: marks completed task as pending", async () => {
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const completeButtons = screen.getAllByText("✓");
    fireEvent.click(completeButtons[1]);

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(2, { status: "pending" });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("calls deleteTask and reload when delete button clicked and confirm OK", async () => {
    window.confirm.mockReturnValueOnce(true);
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const deleteButtons = screen.getAllByText("🗑");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith(1);
      expect(mockReload).toHaveBeenCalled();
    });
  });

  test("does not delete when confirm is cancelled", async () => {
    window.confirm.mockReturnValueOnce(false);
    render(<TaskTable tasks={mockTasks} reload={mockReload} />);
    const deleteButtons = screen.getAllByText("🗑");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteTask).not.toHaveBeenCalled();
      expect(mockReload).not.toHaveBeenCalled();
    });
  });
});
