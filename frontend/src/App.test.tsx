import { render, screen } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

jest.mock("d3-scale", () => ({}));
jest.mock("d3-shape", () => ({}));
jest.mock("d3-color", () => ({}));

describe("Test", () => {
  test("renders learn react link", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query !== "(min-width: 240px) and (max-width: 767px)",
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
    }));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    const header = screen.getByText(/statements/i, { selector: "h3" });
    expect(header).toBeInTheDocument();
  });
});
