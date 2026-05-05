import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

test("renders title and Add Task button", () => {
  const mockSetShowModal = jest.fn();
  render(<Sidebar setShowModal={mockSetShowModal} />);

  expect(screen.getByText("Task Manager")).toBeInTheDocument();
  const addButton = screen.getByText("+ Add Task");
  expect(addButton).toBeInTheDocument();

  fireEvent.click(addButton);
  expect(mockSetShowModal).toHaveBeenCalledWith(true);
});
