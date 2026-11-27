// Deal scoring: one number per deal, so the best bargains sort first.
// The score mixes how deep the cut is with how trustworthy the low is:
// a record low counts more than a routine markdown of the same size.
const VERDICT_BONUS = { "new-low": 25, strong: 12, good: 5, routine: 0 };

export const VERDICT_LABEL = {
  "new-low": "NEW LOW",
  strong: "STRONG DEAL",
  good: "GOOD DEAL",
  routine: "ROUTINE SALE",
};

export function discountPct(deal) {
  return Math.round((1 - deal.price / deal.was) * 100);
}

export function saved(deal) {
  return Math.round((deal.was - deal.price) * 100) / 100;
}

// 10..99. Depth of cut counts most; a verified record low lifts the score.
export function dealScore(deal) {
  const raw = discountPct(deal) * 1.2 + (VERDICT_BONUS[deal.verdict] ?? 0);
  return Math.max(10, Math.min(99, Math.round(raw)));
}

export function verdictLabel(deal) {
  return VERDICT_LABEL[deal.verdict] ?? "DEAL";
}
