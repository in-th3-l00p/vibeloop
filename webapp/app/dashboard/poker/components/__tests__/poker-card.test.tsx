import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PokerCard } from "../poker-card";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, style, ...rest }: any) => (
      <div className={className} style={style} data-testid="card">
        {children}
      </div>
    ),
  },
}));

afterEach(cleanup);

describe("PokerCard", () => {
  it("renders face-down card for '?'", () => {
    const { container } = render(<PokerCard card="?" />);
    expect(container.textContent).toContain("♠");
  });

  it("renders ace of hearts", () => {
    const { container } = render(<PokerCard card="Ah" />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("♥");
  });

  it("renders ten of clubs", () => {
    const { container } = render(<PokerCard card="Tc" />);
    expect(container.textContent).toContain("10");
    expect(container.textContent).toContain("♣");
  });

  it("renders king of spades", () => {
    const { container } = render(<PokerCard card="Ks" />);
    expect(container.textContent).toContain("K");
    expect(container.textContent).toContain("♠");
  });

  it("renders 2 of diamonds", () => {
    const { container } = render(<PokerCard card="2d" />);
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("♦");
  });

  it("applies sm size class", () => {
    const { container } = render(<PokerCard card="Ah" size="sm" />);
    const card = container.querySelector("[data-testid='card']");
    expect(card?.className).toContain("w-10");
  });

  it("applies md size class by default", () => {
    const { container } = render(<PokerCard card="Ah" />);
    const card = container.querySelector("[data-testid='card']");
    expect(card?.className).toContain("w-14");
  });

  it("face-down uses emerald styling", () => {
    const { container } = render(<PokerCard card="?" />);
    const card = container.querySelector("[data-testid='card']");
    expect(card?.className).toContain("emerald");
  });

  it("face-up uses white background", () => {
    const { container } = render(<PokerCard card="5s" />);
    const card = container.querySelector("[data-testid='card']");
    expect(card?.className).toContain("bg-white");
  });

  it("hearts use red color", () => {
    const { container } = render(<PokerCard card="Ah" />);
    const card = container.querySelector("[data-testid='card']") as HTMLElement;
    expect(card.style.color).toBe("rgb(239, 68, 68)");
  });

  it("spades use dark color", () => {
    const { container } = render(<PokerCard card="As" />);
    const card = container.querySelector("[data-testid='card']") as HTMLElement;
    expect(card.style.color).toBe("rgb(30, 30, 46)");
  });

  it("all rank cards render correctly", () => {
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    const expected = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    for (let i = 0; i < ranks.length; i++) {
      cleanup();
      const { container } = render(<PokerCard card={`${ranks[i]}h`} />);
      expect(container.textContent).toContain(expected[i]);
    }
  });
});
