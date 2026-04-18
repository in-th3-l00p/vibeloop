"use client";

import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getMe);
  const getOrCreate = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (isAuthenticated && user === null) {
      getOrCreate();
    }
  }, [user, getOrCreate, isAuthenticated]);

  return {
    user: user ?? undefined,
    isLoading: !isAuthenticated || user === undefined,
  };
}
