import { render, screen, fireEvent } from "@testing-library/react";
import SearchFilter from "./SearchFilter";

describe("SearchFilter", () => {
  let mockOnFilterChange;

  beforeEach(() => {
    mockOnFilterChange = jest.fn();
  });

  it("renders search input field", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
  });

  it("renders dropdowns and category input", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    // Priority dropdown
    expect(
      screen.getByRole("combobox", { name: /priority/i }),
    ).toBeInTheDocument();
    // Status dropdown
    expect(
      screen.getByRole("combobox", { name: /status/i }),
    ).toBeInTheDocument();
    // Category input
    expect(screen.getByPlaceholderText(/category/i)).toBeInTheDocument();
  });

  it("calls onFilterChange with correct query when search text changes", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    fireEvent.change(searchInput, { target: { value: "report" } });
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.stringContaining("q=report"),
    );
  });

  it("calls onFilterChange with all filters", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search tasks/i), {
      target: { value: "test" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /priority/i }), {
      target: { value: "high" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "pending" },
    });
    fireEvent.change(screen.getByPlaceholderText(/category/i), {
      target: { value: "work" },
    });

    const finalCall = mockOnFilterChange.mock.lastCall[0];

    expect(finalCall).toEqual(expect.stringContaining("priority=high"));
    expect(finalCall).toEqual(expect.stringContaining("status=pending"));
    expect(finalCall).toEqual(expect.stringContaining("category=work"));
    expect(finalCall).toEqual(expect.stringContaining("q=test"));
  });

  it("shows active filter chips", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search tasks/i), {
      target: { value: "report" },
    });
    expect(screen.getByText(/Search: "report"/i)).toBeInTheDocument();
  });

  it("clears all filters when button clicked", () => {
    render(<SearchFilter onFilterChange={mockOnFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search tasks/i), {
      target: { value: "report" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /priority/i }), {
      target: { value: "high" },
    });
    fireEvent.click(screen.getByText(/clear filters/i));

    expect(mockOnFilterChange).toHaveBeenLastCalledWith("");
  });
});
