import { render, waitFor } from "@testing-library/react";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

jest.mock("./services/api", () => ({
  getTasks: jest.fn().mockResolvedValue([]),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

test("renders app without crashing", async () => {
  mockLocalStorage.setItem(
    "user",
    JSON.stringify({ id: 1, name: "Test User" }),
  );

  render(
    <GoogleOAuthProvider clientId="test-client-id">
      <App />
    </GoogleOAuthProvider>,
  );

  await waitFor(() => {
    expect(require("./services/api").getTasks).toHaveBeenCalled();
  });
});
