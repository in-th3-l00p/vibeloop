import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ActionBar } from "../action-bar";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className}>{children}</div>
    ),
  },
}));

afterEach(cleanup);

const baseProps = {
  isMyTurn: true,
  canCheck: false,
  callAmount: 20,
  minRaise: 20,
  maxRaise: 980,
  totalPot: 40,
  onFold: vi.fn(),
  onCheck: vi.fn(),
  onCall: vi.fn(),
  onRaise: vi.fn(),
};

describe("ActionBar", () => {
  it("shows waiting message when not my turn", () => {
    render(<ActionBar {...baseProps} isMyTurn={false} />);
    expect(screen.getByText(/waiting for other players/i)).toBeTruthy();
  });

  it("shows Fold, Call, Raise buttons when my turn", () => {
    render(<ActionBar {...baseProps} />);
    expect(screen.getByRole("button", { name: "Fold" })).toBeTruthy();
    expect(screen.getByRole("button", { name: `Call ${baseProps.callAmount}` })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Raise" })).toBeTruthy();
  });

  it("shows Check instead of Call when canCheck is true", () => {
    render(<ActionBar {...baseProps} canCheck={true} callAmount={0} />);
    expect(screen.getByRole("button", { name: "Check" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Call/ })).toBeNull();
  });

  it("calls onFold when Fold is clicked", () => {
    const onFold = vi.fn();
    render(<ActionBar {...baseProps} onFold={onFold} />);
    fireEvent.click(screen.getByRole("button", { name: "Fold" }));
    expect(onFold).toHaveBeenCalledOnce();
  });

  it("calls onCall when Call is clicked", () => {
    const onCall = vi.fn();
    render(<ActionBar {...baseProps} onCall={onCall} />);
    fireEvent.click(screen.getByRole("button", { name: `Call ${baseProps.callAmount}` }));
    expect(onCall).toHaveBeenCalledOnce();
  });

  it("calls onCheck when Check is clicked", () => {
    const onCheck = vi.fn();
    render(<ActionBar {...baseProps} canCheck={true} callAmount={0} onCheck={onCheck} />);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onCheck).toHaveBeenCalledOnce();
  });

  it("opens raise panel when Raise is clicked", () => {
    render(<ActionBar {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    expect(screen.getByRole("button", { name: "Min" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "½ Pot" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pot" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All-In" })).toBeTruthy();
  });

  it("shows raise amount in confirm button", () => {
    render(<ActionBar {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    expect(screen.getByRole("button", { name: `Raise ${baseProps.minRaise}` })).toBeTruthy();
  });

  it("calls onRaise with amount when confirm is clicked", () => {
    const onRaise = vi.fn();
    render(<ActionBar {...baseProps} onRaise={onRaise} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    fireEvent.click(screen.getByRole("button", { name: `Raise ${baseProps.minRaise}` }));
    expect(onRaise).toHaveBeenCalledWith(baseProps.minRaise);
  });

  it("all buttons are disabled when disabled prop is true", () => {
    render(<ActionBar {...baseProps} disabled={true} />);
    expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled();
    expect(screen.getByRole("button", { name: `Call ${baseProps.callAmount}` })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Raise" })).toBeDisabled();
  });

  it("Raise button is disabled when maxRaise is 0", () => {
    render(<ActionBar {...baseProps} maxRaise={0} />);
    expect(screen.getByRole("button", { name: "Raise" })).toBeDisabled();
  });

  it("preset All-In sets raise to maxRaise", () => {
    const onRaise = vi.fn();
    render(<ActionBar {...baseProps} maxRaise={500} onRaise={onRaise} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    fireEvent.click(screen.getByRole("button", { name: "All-In" }));
    fireEvent.click(screen.getByRole("button", { name: "Raise 500" }));
    expect(onRaise).toHaveBeenCalledWith(500);
  });

  it("preset ½ Pot sets correct amount", () => {
    const onRaise = vi.fn();
    render(<ActionBar {...baseProps} totalPot={200} minRaise={20} maxRaise={500} onRaise={onRaise} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    fireEvent.click(screen.getByRole("button", { name: "½ Pot" }));
    fireEvent.click(screen.getByRole("button", { name: "Raise 100" }));
    expect(onRaise).toHaveBeenCalledWith(100);
  });

  it("closes raise panel after confirming", () => {
    render(<ActionBar {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    expect(screen.getByRole("button", { name: "Min" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Raise ${baseProps.minRaise}` }));
    expect(screen.queryByRole("button", { name: "Min" })).toBeNull();
  });
});
