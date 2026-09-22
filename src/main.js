import OBR from "@owlbear-rodeo/sdk";
import "./style.css";
import {
  DEFAULT_FOLLOW_PADDING,
  FOLLOW_PADDING_METADATA_KEY,
  MIN_FOLLOW_PADDING,
  MAX_FOLLOW_PADDING,
  clampFollowPadding,
} from "./follow-logic.js";

document.querySelector("#app").innerHTML = `
  <section id="settings">
    <h1><center> Follow Token </center></h1>
    <label for="padding">
      Zoom padding
      <span id="padding-value">${DEFAULT_FOLLOW_PADDING}</span>
    </label>
    <input
      id="padding"
      type="range"
      min="${MIN_FOLLOW_PADDING}"
      max="${MAX_FOLLOW_PADDING}"
      step="1"
      value="${DEFAULT_FOLLOW_PADDING}"
    />
    <p class="hint">How far to zoom out when following a token. Higher = more zoomed out.</p>
  </section>
`;

const input = document.querySelector("#padding");
const valueLabel = document.querySelector("#padding-value");

OBR.onReady(async () => {
  const metadata = await OBR.player.getMetadata();
  const initial = clampFollowPadding(
    metadata[FOLLOW_PADDING_METADATA_KEY] ?? DEFAULT_FOLLOW_PADDING
  );
  input.value = initial;
  valueLabel.textContent = initial;
// replace the existing input listener
let debounceId;
input.addEventListener("input", () => {
  valueLabel.textContent = input.value;
  clearTimeout(debounceId);
  debounceId = setTimeout(() => {
    OBR.player.setMetadata({
      [FOLLOW_PADDING_METADATA_KEY]: clampFollowPadding(input.value),
    });
  }, 100);
});
// keep the existing "change" listener as-is — it's a cheap, idempotent
// final commit on release, harmless alongside the debounced writes above

  input.addEventListener("change", () => {
    const padding = clampFollowPadding(input.value);
    input.value = padding;
    valueLabel.textContent = padding;
    OBR.player.setMetadata({ [FOLLOW_PADDING_METADATA_KEY]: padding });
  });
  new ResizeObserver(([entry]) => {
  const height = Math.ceil(entry.borderBoxSize[0].blockSize);
  OBR.action.setHeight(height);
}).observe(document.body);
});