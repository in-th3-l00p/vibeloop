import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PotDisplay } from "../pot-display";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className}>{children}</div>
    ),
  },
}));

afterEach(cleanup);

describe("PotDisplay", () => {
  it("shows total pot amount", () => {
    const { container } = render(
      <PotDisplay totalPot={500} pots={[{ amount: 500, eligible: [] }]} />,
    );
    expect(container.textContent).toContain("500");
  });

  it("formats large pot with locale string", () => {
    const { container } = render(
      <PotDisplay totalPot={1500} pots={[{ amount: 1500, eligible: [] }]} />,
    );
    expect(container.textContent).toContain("1,500");
  });

  it("no side pot labels for single pot", () => {
    const { container } = render(
      <PotDisplay totalPot={200} pots={[{ amount: 200, eligible: [] }]} />,
    );
    expect(container.textContent).not.toContain("Main");
    expect(container.textContent).not.toContain("Side");
  });

  it("shows side pot breakdown for multiple pots", () => {
    const pots = [
      { amount: 300, eligible: ["a", "b"] },
      { amount: 200, eligible: ["a"] },
    ];
    const { container } = render(<PotDisplay totalPot={500} pots={pots} />);
    expect(container.textContent).toContain("Main");
    expect(container.textContent).toContain("Side 1");
    expect(container.textContent).toContain("300");
    expect(container.textContent).toContain("200");
  });

  it("shows correct labels for 3 pots", () => {
    const pots = [
      { amount: 100, eligible: [] },
      { amount: 80, eligible: [] },
      { amount: 60, eligible: [] },
    ];
    const { container } = render(<PotDisplay totalPot={240} pots={pots} />);
    expect(container.textContent).toContain("Main");
    expect(container.textContent).toContain("Side 1");
    expect(container.textContent).toContain("Side 2");
  });

  it("shows zero pot", () => {
    const { container } = render(
      <PotDisplay totalPot={0} pots={[{ amount: 0, eligible: [] }]} />,
    );
    expect(container.textContent).toContain("0");
  });
});
