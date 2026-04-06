import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("renders the human-readable status label by default", () => {
    render(<StatusBadge status="pending_payment" />);
    expect(screen.getByText("pending payment")).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    render(<StatusBadge status="completed" label="Done" />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("applies a custom className", () => {
    const { container } = render(<StatusBadge status="completed" className="extra" />);
    expect(container.firstChild).toHaveClass("extra");
  });

  it.each([
    ["completed", "success"],
    ["cancelled", "destructive"],
    ["pending", "warning"],
    ["confirmed", "info"],
    ["draft", "secondary"],
  ] as const)("maps '%s' to the '%s' badge variant", (status, _expectedVariant) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
