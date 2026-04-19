import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PlayerSeat } from "../player-seat";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, style, ...rest }: any) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: any) => <img alt={alt} src={src} />,
}));

vi.mock("../../lib/theme-utils", () => ({
  getProfileCardById: () => ({
    nameBg: "#1a1a2e",
    nameColor: "#ffffff",
    tagColor: "#aaaaaa",
    descColor: "#888888",
    borderColor: "#333333",
    avatarRing: "#a855f7",
  }),
}));

afterEach(cleanup);

const baseProps = {
  username: "TestUser",
  tag: "testuser",
  imageUrl: "",
  cardTheme: "default",
  chips: 1000,
  holeCards: ["Ah", "Kd"] as string[],
  currentBet: 0,
  folded: false,
  allIn: false,
  eliminated: false,
  isDealer: false,
  isCurrentTurn: false,
  isSelf: false,
  accent: "#16a34a",
};

describe("PlayerSeat", () => {
  it("renders username", () => {
    const { container } = render(<PlayerSeat {...baseProps} />);
    expect(container.textContent).toContain("TestUser");
  });

  it("renders tag", () => {
    const { container } = render(<PlayerSeat {...baseProps} />);
    expect(container.textContent).toContain("@testuser");
  });

  it("shows chip count when active", () => {
    const { container } = render(<PlayerSeat {...baseProps} chips={850} />);
    expect(container.textContent).toContain("850 chips");
  });

  it("shows 'Folded' when folded", () => {
    const { container } = render(<PlayerSeat {...baseProps} folded={true} />);
    expect(container.textContent).toContain("Folded");
  });

  it("shows 'ALL IN' when all-in", () => {
    const { container } = render(<PlayerSeat {...baseProps} allIn={true} />);
    expect(container.textContent).toContain("ALL IN");
  });

  it("shows 'Out' when eliminated", () => {
    const { container } = render(<PlayerSeat {...baseProps} eliminated={true} />);
    expect(container.textContent).toContain("Out");
  });

  it("shows 'Sitting Out' when sitting out", () => {
    const { container } = render(<PlayerSeat {...baseProps} sittingOut={true} />);
    expect(container.textContent).toContain("Sitting Out");
  });

  it("shows dealer badge D", () => {
    const { container } = render(<PlayerSeat {...baseProps} isDealer={true} />);
    const spans = container.querySelectorAll("span");
    const dBadge = Array.from(spans).find((s) => s.textContent === "D");
    expect(dBadge).toBeTruthy();
  });

  it("hides dealer badge during handComplete", () => {
    const { container } = render(
      <PlayerSeat {...baseProps} isDealer={true} isHandComplete={true} />,
    );
    const spans = container.querySelectorAll("span");
    const dBadge = Array.from(spans).find(
      (s) => s.textContent === "D" && s.className.includes("bg-yellow"),
    );
    expect(dBadge).toBeFalsy();
  });

  it("shows ready checkmark", () => {
    const { container } = render(
      <PlayerSeat {...baseProps} isHandComplete={true} readyForNext={true} />,
    );
    expect(container.textContent).toContain("✓");
  });

  it("shows current bet", () => {
    const { container } = render(<PlayerSeat {...baseProps} currentBet={50} />);
    expect(container.textContent).toContain("50");
  });

  it("hides bet when folded", () => {
    const { container } = render(<PlayerSeat {...baseProps} currentBet={50} folded={true} />);
    // Bet chip display is conditionally hidden when folded
    const betChips = container.querySelectorAll(".bg-yellow-500");
    expect(betChips.length).toBe(0);
  });

  it("applies reduced opacity when folded", () => {
    const { container } = render(<PlayerSeat {...baseProps} folded={true} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("opacity-40");
  });

  it("applies full opacity when active", () => {
    const { container } = render(<PlayerSeat {...baseProps} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("opacity-100");
  });

  it("shows initial letter when no imageUrl", () => {
    const { container } = render(<PlayerSeat {...baseProps} imageUrl="" username="Alice" />);
    expect(container.textContent).toContain("A");
  });

  it("renders image when imageUrl provided", () => {
    const { container } = render(
      <PlayerSeat {...baseProps} imageUrl="https://example.com/avatar.png" />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.alt).toBe("TestUser");
  });

  it("status priority: eliminated shows 'Out'", () => {
    const { container } = render(
      <PlayerSeat
        {...baseProps}
        eliminated={true}
        sittingOut={true}
        folded={true}
        allIn={true}
      />,
    );
    expect(container.textContent).toContain("Out");
  });

  it("status priority: sittingOut shows 'Sitting Out' over folded", () => {
    const { container } = render(
      <PlayerSeat {...baseProps} sittingOut={true} folded={true} />,
    );
    expect(container.textContent).toContain("Sitting Out");
  });
});
