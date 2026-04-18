/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

async function createUser(t: ReturnType<typeof convexTest>, name: string) {
  const asUser = t.withIdentity({
    name,
    preferredUsername: name.toLowerCase(),
    tokenIdentifier: `clerk|${name.toLowerCase()}`,
  });
  await asUser.mutation(api.users.getOrCreateUser, {});
  return asUser;
}

async function getUserId(
  asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
): Promise<Id<"users">> {
  const user = await asUser.query(api.users.getMe, {});
  return user!._id;
}

describe("lobbyInvitations.send", () => {
  it("creates a pending invitation", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });
    expect(invId).toBeDefined();

    const invitations = await asBob.query(api.lobbyInvitations.listMyInvitations, {});
    expect(invitations).toHaveLength(1);
    expect(invitations[0].sender.username).toBe("alice");
  });

  it("rejects duplicate pending invitation", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await asAlice.mutation(api.lobbyInvitations.send, { lobbyId, targetUserId: bobId });

    await expect(
      asAlice.mutation(api.lobbyInvitations.send, { lobbyId, targetUserId: bobId }),
    ).rejects.toThrowError("Invitation already sent");
  });

  it("rejects if target already in lobby", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await expect(
      asAlice.mutation(api.lobbyInvitations.send, { lobbyId, targetUserId: bobId }),
    ).rejects.toThrowError("User is already in this lobby");
  });

  it("rejects self-invite", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(asAlice);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await expect(
      asAlice.mutation(api.lobbyInvitations.send, { lobbyId, targetUserId: aliceId }),
    ).rejects.toThrowError("Cannot invite yourself");
  });
});

describe("lobbyInvitations.accept", () => {
  it("joins the lobby and leaves old one", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const aliceLobby = await asAlice.mutation(api.lobbies.create, {
      name: "Alice's Room",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.getOrCreateMyLobby, {});

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId: aliceLobby,
      targetUserId: bobId,
    });

    await asBob.mutation(api.lobbyInvitations.accept, { invitationId: invId });

    const bobLobby = await asBob.query(api.lobbies.getMyLobby, {});
    expect(bobLobby!.lobby._id).toEqual(aliceLobby);
    expect(bobLobby!.members).toHaveLength(2);
  });

  it("rejects if not the recipient", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const asCharlie = await createUser(t, "Charlie");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });

    await expect(
      asCharlie.mutation(api.lobbyInvitations.accept, { invitationId: invId }),
    ).rejects.toThrowError("This invitation is not for you");
  });
});

describe("lobbyInvitations.decline", () => {
  it("removes the invitation", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });

    await asBob.mutation(api.lobbyInvitations.decline, { invitationId: invId });

    const invitations = await asBob.query(api.lobbyInvitations.listMyInvitations, {});
    expect(invitations).toHaveLength(0);
  });
});

describe("lobbyInvitations.cancel", () => {
  it("sender can cancel their invitation", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });

    await asAlice.mutation(api.lobbyInvitations.cancel, { invitationId: invId });

    const invitations = await asBob.query(api.lobbyInvitations.listMyInvitations, {});
    expect(invitations).toHaveLength(0);
  });

  it("non-sender cannot cancel", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const invId = await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });

    await expect(
      asBob.mutation(api.lobbyInvitations.cancel, { invitationId: invId }),
    ).rejects.toThrowError("Can only cancel invitations you sent");
  });
});

describe("lobbyInvitations.listMyInvitations", () => {
  it("returns only pending invitations with enriched data", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(asBob);

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Cool Room",
      maxPlayers: 10,
    });

    await asAlice.mutation(api.lobbyInvitations.send, {
      lobbyId,
      targetUserId: bobId,
    });

    const invitations = await asBob.query(api.lobbyInvitations.listMyInvitations, {});
    expect(invitations).toHaveLength(1);
    expect(invitations[0].lobby.name).toBe("Cool Room");
    expect(invitations[0].sender.username).toBe("alice");
  });

  it("returns empty for no invitations", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const invitations = await asAlice.query(api.lobbyInvitations.listMyInvitations, {});
    expect(invitations).toEqual([]);
  });
});
