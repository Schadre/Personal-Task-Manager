jest.mock("./services/api", () => ({
  getTasks: jest.fn().mockResolvedValue([]),
  createTask: jest.fn().mockResolvedValue({}),
  updateTask: jest.fn().mockResolvedValue({}),
  deleteTask: jest.fn().mockResolvedValue({}),
}));

import { render, waitFor } from "@testing-library/react";
import App from "./App";

test("renders app without crashing", async () => {
  render(<App />);

  await waitFor(() => {
    expect(require("./services/api").getTasks).toHaveBeenCalled();
  });
});
