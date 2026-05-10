module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^../services/api$": "<rootDir>/src/__mocks__/api.js",
    "^./services/api$": "<rootDir>/src/__mocks__/api.js",
    "../services/api": "<rootDir>/src/__mocks__/api.js",
    "./services/api": "<rootDir>/src/__mocks__/api.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [],
};
