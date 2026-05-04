import { render, screen } from "@testing-library/react";
import SearchFilter from "./SearchFilter";

test("renders search input field", () => {
  render(<SearchFilter />);
  const input = screen.getByPlaceholderText("Search tasks...");
  expect(input).toBeInTheDocument();
});
