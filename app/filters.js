// Filtering and sorting: the shopper's controls, as pure functions over the deals.
// State is one plain object: { q, category, store, minPct, lowsOnly, sort }.
// The URL hash carries the same state, so a filtered view is a linkable page.

import { dealScore, discountPct } from "./score.js";

export const SORTS = {
  score: "Best deals first",
  pct: "Biggest % off",
  saved: "Biggest $ saved",
  low: "Lowest price",
  high: "Highest price",
};

export function defaultState() {
  return { q: "", category: "All", store: "All", minPct: 0, lowsOnly: false, sort: "score" };
}

export function parseHash(hash) {
  const state = defaultState();
  const raw = hash.replace(/^#\/?/, "");
  if (!raw || raw.startsWith("deal/")) return state;
  const params = new URLSearchParams(raw.split("?")[1] ?? "");
  if (params.get("q")) state.q = params.get("q");
  if (params.get("cat")) state.category = params.get("cat");
  if (params.get("store")) state.store = params.get("store");
  const min = Number(params.get("min"));
  if (Number.isFinite(min) && min > 0) state.minPct = min;
  if (params.get("lows") === "1") state.lowsOnly = true;
  if (SORTS[params.get("sort")]) state.sort = params.get("sort");
  return state;
}

export function toHash(state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category !== "All") params.set("cat", state.category);
  if (state.store !== "All") params.set("store", state.store);
  if (state.minPct > 0) params.set("min", String(state.minPct));
  if (state.lowsOnly) params.set("lows", "1");
  if (state.sort !== "score") params.set("sort", state.sort);
  const qs = params.toString();
  return "#/" + (qs ? "?" + qs : "");
}

export function categories(deals) {
  return ["All", ...new Set(deals.map((d) => d.category))];
}

export function stores(deals) {
  return ["All", ...new Set(deals.map((d) => d.store))];
}

export function applyFilters(deals, state) {
  const q = state.q.trim().toLowerCase();
  let shown = deals.filter((d) => {
    if (state.category !== "All" && d.category !== state.category) return false;
    if (state.store !== "All" && d.store !== state.store) return false;
    if (discountPct(d) < state.minPct) return false;
    if (state.lowsOnly && d.verdict !== "new-low") return false;
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    score: (a, b) => dealScore(b) - dealScore(a),
    pct: (a, b) => discountPct(b) - discountPct(a),
    saved: (a, b) => savedOf(b) - savedOf(a),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  };
  shown = [...shown].sort(by[state.sort] ?? by.score);
  return shown;
}

function savedOf(d) {
  return d.was - d.price;
}

export function stats(deals) {
  const total = deals.length;
  const avgPct = Math.round(deals.reduce((s, d) => s + discountPct(d), 0) / total);
  const best = deals.reduce((a, d) => (dealScore(d) > dealScore(a) ? d : a), deals[0]);
  const biggestSave = deals.reduce((a, d) => (savedOf(d) > savedOf(a) ? d : a), deals[0]);
  const lows = deals.filter((d) => d.verdict === "new-low").length;
  return { total, avgPct, best, biggestSave, lows };
}
