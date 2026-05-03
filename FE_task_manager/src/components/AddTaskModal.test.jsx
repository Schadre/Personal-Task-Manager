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

  test("calls createTask and closes modal on save", async () => {
    render(<AddTaskModal close={mockClose} reload={mockReload} />);

    const input = screen.getByPlaceholderText("Task title");
    const saveButton = screen.getByText("Save Task");

    fireEvent.change(input, { target: { value: "Buy milk" } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({ title: "Buy milk" });
      expect(mockReload).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
