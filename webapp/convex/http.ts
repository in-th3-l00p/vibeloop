import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Alchemy webhook endpoint for NFT transfer events
http.route({
  path: "/webhook/alchemy",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // TODO: Validate Alchemy webhook signature
    // const signature = req.headers.get("x-alchemy-signature");

    const body = await req.json();

    // Alchemy webhook payload structure for NFT activity
    const events = body?.event?.activity ?? [];

    for (const event of events) {
      if (event.category === "erc721") {
        await ctx.runMutation(internal.nft.syncTransferEvent, {
          contractAddress: event.rawContract?.address ?? "",
          tokenId: event.erc721TokenId ?? "",
          fromAddress: event.fromAddress ?? "",
          toAddress: event.toAddress ?? "",
          itemSlug: "", // TODO: Map tokenId to itemSlug via contract metadata
          blockTimestamp: Date.now(),
          txHash: event.hash ?? "",
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
