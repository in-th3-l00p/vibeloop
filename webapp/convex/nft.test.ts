/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createUserWithWallet(
  t: ReturnType<typeof convexTest>,
  name: string,
  wallet: string,
) {
  const asUser = t.withIdentity({
    name,
    preferredUsername: name.toLowerCase(),
    tokenIdentifier: `clerk|${name.toLowerCase()}`,
  });
  await asUser.mutation(api.users.getOrCreateUser, {});
  await asUser.mutation(api.users.linkWallet, { walletAddress: wallet });
  return asUser;
}

describe("nft.getMyInventory", () => {
  it("returns empty for new user", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    const inventory = await asAlice.query(api.nft.getMyInventory, {});
    expect(inventory).toEqual([]);
  });

  it("returns empty for unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const inventory = await t.query(api.nft.getMyInventory, {});
    expect(inventory).toEqual([]);
  });
});

describe("nft.syncTransferEvent", () => {
  it("creates inventory record on transfer-in", async () => {
    const t = convexTest(schema, modules);
    const wallet = "0xAliceWallet";
    const asAlice = await createUserWithWallet(t, "Alice", wallet);

    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: wallet,
      itemSlug: "neon-pulse",
      blockTimestamp: 1700000000,
      txHash: "0xTx1",
    });

    const inventory = await asAlice.query(api.nft.getMyInventory, {});
    expect(inventory).toHaveLength(1);
    expect(inventory[0]).toMatchObject({
      contractAddress: "0xContract1",
      tokenId: "42",
      itemSlug: "neon-pulse",
      txHash: "0xTx1",
    });
  });

  it("removes record on transfer-out", async () => {
    const t = convexTest(schema, modules);
    const wallet = "0xAliceWallet";
    const asAlice = await createUserWithWallet(t, "Alice", wallet);

    // Mint to Alice
    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: wallet,
      itemSlug: "neon-pulse",
      blockTimestamp: 1700000000,
      txHash: "0xTx1",
    });

    // Transfer away from Alice
    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: wallet,
      toAddress: "0xSomeoneElse",
      itemSlug: "neon-pulse",
      blockTimestamp: 1700001000,
      txHash: "0xTx2",
    });

    const inventory = await asAlice.query(api.nft.getMyInventory, {});
    expect(inventory).toEqual([]);
  });

  it("handles burn (transfer to zero address)", async () => {
    const t = convexTest(schema, modules);
    const wallet = "0xAliceWallet";
    const asAlice = await createUserWithWallet(t, "Alice", wallet);

    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: wallet,
      itemSlug: "neon-pulse",
      blockTimestamp: 1700000000,
      txHash: "0xTx1",
    });

    // Burn
    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: wallet,
      toAddress: "0x0000000000000000000000000000000000000000",
      itemSlug: "neon-pulse",
      blockTimestamp: 1700001000,
      txHash: "0xTx2",
    });

    const inventory = await asAlice.query(api.nft.getMyInventory, {});
    expect(inventory).toEqual([]);
  });
});

describe("nft.ownsItem", () => {
  it("returns true when user owns the item", async () => {
    const t = convexTest(schema, modules);
    const wallet = "0xAliceWallet";
    const asAlice = await createUserWithWallet(t, "Alice", wallet);

    await t.mutation(internal.nft.syncTransferEvent, {
      contractAddress: "0xContract1",
      tokenId: "42",
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: wallet,
      itemSlug: "neon-pulse",
      blockTimestamp: 1700000000,
      txHash: "0xTx1",
    });

    const owns = await asAlice.query(api.nft.ownsItem, {
      itemSlug: "neon-pulse",
    });
    expect(owns).toBe(true);
  });

  it("returns false when user does not own the item", async () => {
    const t = convexTest(schema, modules);
    const asAlice = t.withIdentity({
      name: "Alice",
      tokenIdentifier: "clerk|alice",
    });
    await asAlice.mutation(api.users.getOrCreateUser, {});

    const owns = await asAlice.query(api.nft.ownsItem, {
      itemSlug: "neon-pulse",
    });
    expect(owns).toBe(false);
  });
});

describe("nft.syncVibeBalance", () => {
  it("updates cached balance", async () => {
    const t = convexTest(schema, modules);
    const wallet = "0xAliceWallet";
    const asAlice = await createUserWithWallet(t, "Alice", wallet);

    await t.mutation(internal.nft.syncVibeBalance, {
      walletAddress: wallet,
      balance: 1500,
    });

    const user = await asAlice.query(api.users.getMe, {});
    expect(user!.vibeBalance).toBe(1500);
  });

  it("ignores unknown wallet", async () => {
    const t = convexTest(schema, modules);

    // Should not throw
    await t.mutation(internal.nft.syncVibeBalance, {
      walletAddress: "0xUnknown",
      balance: 1000,
    });
  });
});
