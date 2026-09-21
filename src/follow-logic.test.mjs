import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getFollowBounds,
  DEFAULT_FOLLOW_PADDING,
  clampFollowPadding,
  MIN_FOLLOW_PADDING,
  MAX_FOLLOW_PADDING,
} from "./follow-logic.js";

test("returns null when there's no selection bounds", () => {
  assert.equal(getFollowBounds(null), null);
  assert.equal(getFollowBounds(undefined), null);
});

test("pads the bounding box around its center", () => {
  const bounds = { center: { x: 100, y: 200 }, width: 50, height: 50 };
  const result = getFollowBounds(bounds, 2); // padding=2 → half-size 50 in each direction
  assert.deepEqual(result, {
    min: { x: 50, y: 150 },
    max: { x: 150, y: 250 },
  });
});

test("default padding matches DEFAULT_FOLLOW_PADDING", () => {
  const bounds = { center: { x: 0, y: 0 }, width: 10, height: 10 };
  const result = getFollowBounds(bounds);
  const half = (10 * DEFAULT_FOLLOW_PADDING) / 2;
  assert.deepEqual(result, { min: { x: -half, y: -half }, max: { x: half, y: half } });
});

test("clampFollowPadding falls back to default on invalid input", () => {
  assert.equal(clampFollowPadding(undefined), DEFAULT_FOLLOW_PADDING);
  assert.equal(clampFollowPadding(""), DEFAULT_FOLLOW_PADDING);
  assert.equal(clampFollowPadding("abc"), DEFAULT_FOLLOW_PADDING);
});

test("clampFollowPadding clamps out-of-range values", () => {
  assert.equal(clampFollowPadding(0), MIN_FOLLOW_PADDING);
  assert.equal(clampFollowPadding(-5), MIN_FOLLOW_PADDING);
  assert.equal(clampFollowPadding(999), MAX_FOLLOW_PADDING);
});

test("clampFollowPadding passes through in-range values", () => {
  assert.equal(clampFollowPadding(20), 20);
  assert.equal(clampFollowPadding("20"), 20);
});