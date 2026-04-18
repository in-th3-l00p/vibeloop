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

describe("chat.send", () => {
  it("inserts message for lobby member", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await asAlice.mutation(api.chat.send, {
      lobbyId,
      text: "Hello everyone!",
    });

    const messages = await t.query(api.chat.list, { lobbyId });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      text: "Hello everyone!",
      username: "alice",
    });
  });

  it("rejects non-members", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await expect(
      asBob.mutation(api.chat.send, { lobbyId, text: "Hi" }),
    ).rejects.toThrowError("Must be a lobby member to send messages");
  });

  it("rejects empty messages", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    await expect(
      asAlice.mutation(api.chat.send, { lobbyId, text: "   " }),
    ).rejects.toThrowError("Message cannot be empty");
  });
});

describe("chat.list", () => {
  it("returns messages ordered by creation time", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");
    const asBob = await createUser(t, "Bob");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });
    await asBob.mutation(api.lobbies.join, { lobbyId });

    await asAlice.mutation(api.chat.send, { lobbyId, text: "First" });
    await asBob.mutation(api.chat.send, { lobbyId, text: "Second" });
    await asAlice.mutation(api.chat.send, { lobbyId, text: "Third" });

    const messages = await t.query(api.chat.list, { lobbyId });
    expect(messages).toHaveLength(3);
    expect(messages[0].text).toBe("First");
    expect(messages[1].text).toBe("Second");
    expect(messages[2].text).toBe("Third");
  });

  it("returns empty for lobby with no messages", async () => {
    const t = convexTest(schema, modules);
    const asAlice = await createUser(t, "Alice");

    const lobbyId = await asAlice.mutation(api.lobbies.create, {
      name: "Test",
      maxPlayers: 10,
    });

    const messages = await t.query(api.chat.list, { lobbyId });
    expect(messages).toEqual([]);
  });
});
