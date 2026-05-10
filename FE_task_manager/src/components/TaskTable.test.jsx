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

    expect(screen.getByText("Task One")).toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); 
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
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
