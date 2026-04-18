"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useProfile() {
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const linkWalletMutation = useMutation(api.users.linkWallet);

  function updateProfile(updates: {
    bio?: string;
    accent?: string;
    banner?: string;
    tag?: string;
  }) {
    return updateProfileMutation(updates);
  }

  function linkWallet(walletAddress: string) {
    return linkWalletMutation({ walletAddress });
  }

  return { updateProfile, linkWallet };
}
