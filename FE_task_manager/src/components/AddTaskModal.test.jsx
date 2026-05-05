import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddTaskModal from "./AddTaskModal";
import { createTask } from "../services/api";

jest.mock("../services/api");

describe("AddTaskModal", () => {
  const mockClose = jest.fn();
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves task with all fields and calls reload & close", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);

    await userEvent.type(screen.getByLabelText(/title/i), "Finish report");
    await userEvent.type(
      screen.getByLabelText(/description/i),
      "Complete the capstone writeup",
    );
    await userEvent.type(screen.getByLabelText(/due date/i), "2026-06-01");
    await userEvent.selectOptions(screen.getByLabelText(/priority/i), "high");
    await userEvent.type(screen.getByLabelText(/category/i), "Work");

    fireEvent.click(screen.getByText(/save task/i));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        title: "Finish report",
        description: "Complete the capstone writeup",
        due_date: "2026-06-01T00:00:00.000Z",
        priority: "high",
        category: "Work",
      });
    });

    expect(mockReload).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it("saves task with only required fields (description, due date, category empty/null)", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);

    await userEvent.type(screen.getByLabelText(/title/i), "Quick task");
    fireEvent.click(screen.getByText(/save task/i));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        title: "Quick task",
        description: "",
        due_date: null,
        priority: "medium",
        category: "Uncategorized",
      });
    });

    expect(mockReload).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
