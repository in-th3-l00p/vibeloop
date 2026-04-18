/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

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
  t: ReturnType<typeof convexTest>,
  asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
) {
  const user = await asUser.query(api.users.getMe, {});
  return user!._id;
}

describe("friends.sendRequest", () => {
  it("creates a pending friendship", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    const friendshipId = await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: bobId,
    });
    expect(friendshipId).toBeDefined();
  });

  it("prevents duplicate requests", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    await asAlice.mutation(api.friends.sendRequest, { targetUserId: bobId });
    await expect(
      asAlice.mutation(api.friends.sendRequest, { targetUserId: bobId }),
    ).rejects.toThrowError("Friendship already exists");
  });

  it("prevents self-friending", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const aliceId = await getUserId(t, asAlice);

    await expect(
      asAlice.mutation(api.friends.sendRequest, { targetUserId: aliceId }),
    ).rejects.toThrowError("Cannot friend yourself");
  });

  it("enforces user1 < user2 ordering regardless of who sends", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    await asAlice.mutation(api.friends.sendRequest, { targetUserId: bobId });

    const friends = await asAlice.query(api.friends.listFriends, {});
    // Even though not accepted, let's verify the friendship was created
    // by checking that Bob can't also send a request
    await expect(
      asBob.mutation(api.friends.sendRequest, {
        targetUserId: (await asAlice.query(api.users.getMe, {}))!._id,
      }),
    ).rejects.toThrowError("Friendship already exists");
  });
});

describe("friends.acceptRequest", () => {
  it("changes status to accepted", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    const friendshipId = await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: bobId,
    });

    await asBob.mutation(api.friends.acceptRequest, { friendshipId });

    const friends = await asBob.query(api.friends.listFriends, {});
    expect(friends).toHaveLength(1);
    expect(friends[0].user.username).toBe("alice");
  });

  it("prevents sender from accepting their own request", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    const friendshipId = await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: bobId,
    });

    await expect(
      asAlice.mutation(api.friends.acceptRequest, { friendshipId }),
    ).rejects.toThrowError("Cannot accept your own request");
  });
});

describe("friends.listFriends", () => {
  it("returns only accepted friends", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const asCharlie = await createUser(t, "Charlie");
    const bobId = await getUserId(t, asBob);
    const charlieId = await getUserId(t, asCharlie);

    // Alice sends to both
    const f1 = await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: bobId,
    });
    await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: charlieId,
    });

    // Only Bob accepts
    await asBob.mutation(api.friends.acceptRequest, { friendshipId: f1 });

    const friends = await asAlice.query(api.friends.listFriends, {});
    expect(friends).toHaveLength(1);
    expect(friends[0].user.username).toBe("bob");
  });

  it("returns empty for unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const friends = await t.query(api.friends.listFriends, {});
    expect(friends).toEqual([]);
  });
});

describe("friends.removeFriend", () => {
  it("deletes the friendship", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");
    const bobId = await getUserId(t, asBob);

    const friendshipId = await asAlice.mutation(api.friends.sendRequest, {
      targetUserId: bobId,
    });
    await asBob.mutation(api.friends.acceptRequest, { friendshipId });

    await asAlice.mutation(api.friends.removeFriend, { friendshipId });

    const friends = await asAlice.query(api.friends.listFriends, {});
    expect(friends).toHaveLength(0);
  });
});
