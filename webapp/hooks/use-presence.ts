"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

export function usePresence(status: "online" | "in-game" = "online") {
  const { isAuthenticated } = useConvexAuth();
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!isAuthenticated) return;
    heartbeat({ status });
    const interval = setInterval(() => {
      heartbeat({ status });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [heartbeat, status, isAuthenticated]);
}
