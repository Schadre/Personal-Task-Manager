import { render, screen } from "@testing-library/react";
import StatsCards from "./StatsCards";

describe("StatsCards", () => {
  const mockTasks = [
    { id: 1, status: "pending" },
    { id: 2, status: "completed" },
    { id: 3, status: "pending" },
    { id: 4, status: "completed" },
    { id: 5, status: "completed" },
  ];

  test("displays correct counts", () => {
    render(<StatsCards tasks={mockTasks} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("handles empty tasks array", () => {
    render(<StatsCards tasks={[]} />);
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(3);
  });
});
