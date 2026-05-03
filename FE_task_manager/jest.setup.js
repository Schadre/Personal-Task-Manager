import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();

globalThis.import = {
  meta: {
    env: {
      VITE_API_BASE: "/api",
    },
  },
};
