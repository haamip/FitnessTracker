import { describe, expect, it, vi } from "vitest";
import { inspectWatchConnection } from "./watchConnectionStatus";

describe("watch connection diagnostic states", () => {
  it("explains that a website cannot access native health data", async () => {
    const status = await inspectWatchConnection({ native: false, provider: null });
    expect(status.state).toBe("browser");
  });
  it("points out missing native plugin", async () => {
    const status = await inspectWatchConnection({ native: true, provider: null });
    expect(status.state).toBe("plugin-missing");
  });
  it("distinguishes permission denial from a working connection", async () => {
    const bridge = { getStatus: vi.fn(async () => ({ available: true, stepsGranted: false })) };
    const provider = { name: "Health Connect", bridge };
    expect((await inspectWatchConnection({ native: true, provider })).state).toBe("permission-needed");
    bridge.getStatus.mockResolvedValue({ available: true, stepsGranted: true });
    expect((await inspectWatchConnection({ native: true, provider })).state).toBe("ready");
  });
  it("reports unavailable provider and failed status calls", async () => {
    const provider = { name: "Health Connect", bridge: { getStatus: async () => ({ available: false }) } };
    expect((await inspectWatchConnection({ native: true, provider })).state).toBe("unavailable");
    provider.bridge.getStatus = async () => { throw new Error("unsafe internal information"); };
    const failed = await inspectWatchConnection({ native: true, provider });
    expect(failed.state).toBe("connection-error");
    expect(failed.message).not.toContain("unsafe internal information");
  });
});
