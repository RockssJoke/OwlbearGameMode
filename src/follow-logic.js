export const DEFAULT_FOLLOW_PADDING = 12; // multiplier on the token's bounding box before fitting.
                                  // Higher = more zoomed out, lower = tighter on the token. Tune by testing.
export const FOLLOW_PADDING_METADATA_KEY = "com.theo.follow-token/padding";
export const MIN_FOLLOW_PADDING = 1;
export const MAX_FOLLOW_PADDING = 50;

export function getFollowBounds(bounds, padding = DEFAULT_FOLLOW_PADDING) {
  if (!bounds) return null;
  const { center, width, height } = bounds;
  const paddedWidth = width * padding;
  const paddedHeight = height * padding;
  return {
    center,
    width: paddedWidth,
    height: paddedHeight,
    min: { x: center.x - paddedWidth / 2, y: center.y - paddedHeight / 2 },
    max: { x: center.x + paddedWidth / 2, y: center.y + paddedHeight / 2 },
  };
}
// Validates/normalizes a padding value coming from the popover input or
// stored player metadata, so a bad/missing value never reaches the viewport math.
export function clampFollowPadding(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_FOLLOW_PADDING;
  return Math.min(MAX_FOLLOW_PADDING, Math.max(MIN_FOLLOW_PADDING, parsed));
}