import OBR from "@owlbear-rodeo/sdk";
import {
  getFollowBounds,
  DEFAULT_FOLLOW_PADDING,
  FOLLOW_PADDING_METADATA_KEY,
  clampFollowPadding,
  shouldReclaimSelection,
} from "./follow-logic.js";

const ID = "com.theo.follow-token";
const FOLLOWING_KEY = `${ID}/following`;

let following = false;
let followedTokenId = null;
let lastPosition = null; // { x, y } — used to detect actual movement vs. noise
let followPadding = DEFAULT_FOLLOW_PADDING; // synced live with the popover via player metadata

OBR.onReady(async () => {
  const metadata = await OBR.player.getMetadata();
  followPadding = clampFollowPadding(
    metadata[FOLLOW_PADDING_METADATA_KEY] ?? DEFAULT_FOLLOW_PADDING
  );

  OBR.player.onChange((player) => {
    followPadding = clampFollowPadding(
      player.metadata[FOLLOW_PADDING_METADATA_KEY] ?? DEFAULT_FOLLOW_PADDING
    );
    reclaimSelectionIfEmpty();
    reanimateFollowedToken();
  });

  OBR.contextMenu.create({
    id: `${ID}/context-menu`,
    icons: [
      {
        icon: "/follow.svg",
        label: "Follow Token",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", FOLLOWING_KEY], value: undefined },
          ],
        },
      },
      {
        icon: "/stop-follow.svg",
        label: "Stop Following",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", FOLLOWING_KEY], value: true },
          ],
        },
      },
    ],
    onClick: handleFollowClick,
  });

  OBR.scene.items.onChange(handleItemsChange);
});

async function handleFollowClick(context) {
  const token = context.items?.[0];
  if (!token) return;

  try {
    if (followedTokenId === token.id) {
      await stopFollowing();
    } else {
      await startFollowing(context, token);
    }
  } catch (err) {
    console.error("[follow-token] toggle failed:", err);
  }
}

async function startFollowing(context, token) {
  if (followedTokenId && followedTokenId !== token.id) {
    await clearFollowingMetadata(followedTokenId);
  }

  following = true;
  followedTokenId = token.id;
  lastPosition = { ...token.position };

  await OBR.scene.items.updateItems([token.id], (items) => {
    for (const item of items) item.metadata[FOLLOWING_KEY] = true;
  });

  await OBR.player.select([token.id], true); // grab control so arrow keys move it right away

  const bounds = getFollowBounds(context.selectionBounds, followPadding);
  if (bounds) await OBR.viewport.animateToBounds(bounds);
}

async function stopFollowing() {
  if (followedTokenId) await clearFollowingMetadata(followedTokenId);
  following = false;
  followedTokenId = null;
  lastPosition = null;
}

async function clearFollowingMetadata(id) {
  await OBR.scene.items.updateItems([id], (items) => {
    for (const item of items) delete item.metadata[FOLLOWING_KEY];
  });
}

async function reclaimSelectionIfEmpty() {
  try {
    const selection = await OBR.player.getSelection();
    if (!shouldReclaimSelection(following, followedTokenId, selection)) return;
    await OBR.player.select([followedTokenId], true);
  } catch (err) {
    console.error("[follow-token] failed to reclaim selection:", err);
  }
}

async function handleItemsChange(items) {
  if (!following || !followedTokenId) return;

  const token = items.find((item) => item.id === followedTokenId);
  if (!token) {
    // Followed token was deleted — its metadata is gone with it, just reset local state.
    following = false;
    followedTokenId = null;
    lastPosition = null;
    return;
  }

  if (
    lastPosition &&
    token.position.x === lastPosition.x &&
    token.position.y === lastPosition.y
  ) {
    return; // nothing moved, don't re-animate on unrelated scene edits
  }

  lastPosition = { ...token.position };
  await reanimateFollowedToken();
}
// new helper, place near handleItemsChange
async function reanimateFollowedToken() {
  if (!following || !followedTokenId) return;
  try {
    const itemBounds = await OBR.scene.items.getItemBounds([followedTokenId]);
    const bounds = getFollowBounds(itemBounds, followPadding);
    if (bounds) await OBR.viewport.animateToBounds(bounds);
  } catch (err) {
    console.error("[follow-token] failed to re-animate to token bounds:", err);
  }
}