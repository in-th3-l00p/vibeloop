"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useEvents() {
  const events = useQuery(api.events.getMyEvents);
  const dismissMutation = useMutation(api.events.dismiss);

  return {
    events: events ?? [],
    isLoading: events === undefined,
    dismiss: (eventId: Id<"userEvents">) => dismissMutation({ eventId }),
  };
}
