// HTML for every page, built from the deal data. Every value is escaped before it
// reaches the page, and every price shown is computed from price and was, so the
// discount on screen always matches the two prices.

import { dealScore, discountPct, saved, verdictLabel } from "./score.js";
import { categories, stats, stores } from "./filters.js";

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

const day = (iso) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

function verdictChip(d) {
  return `<span class="verdict verdict-${d.verdict}">${verdictLabel(d)}</span>`;
}

function scoreBadge(d) {
  return `<span class="score" title="Deal Score: depth of cut plus how trustworthy the low is">Score ${dealScore(d)}</span>`;
}

export function card(d) {
  return `<article class="card">
  <div class="card-top"><span class="cat">${escape(d.category)}</span>${verdictChip(d)}</div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="store">${escape(d.store)}</p>
  <p class="prices"><span class="price">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="off">−${discountPct(d)}%</span></p>
  <p class="save">You save ${usd(saved(d))} · ${scoreBadge(d)}</p>
  <p class="why">${escape(d.why)}</p>
  <p class="meta">Checked ${day(d.checked)}</p>
  <p class="actions"><a class="btn" href="${escape(d.url)}" rel="noopener" target="_blank">View at ${escape(d.store)} ↗</a>
  <a class="btn ghost" href="#/deal/${encodeURIComponent(d.id)}">Details</a></p>
</article>`;
}

function controls(state, deals) {
  const cats = categories(deals)
    .map((c) => `<button type="button" data-cat="${escape(c)}" class="${c === state.category ? "on" : ""}">${escape(c)}</button>`)
    .join("");
  const storeOpts = stores(deals)
    .map((s) => `<option value="${escape(s)}" ${s === state.store ? "selected" : ""}>${escape(s)}</option>`)
    .join("");
  const minOpts = [0, 20, 30, 40, 50]
    .map((m) => `<option value="${m}" ${m === state.minPct ? "selected" : ""}>${m === 0 ? "Any discount" : m + "% off or more"}</option>`)
    .join("");
  const sortOpts = Object.entries({
    score: "Best deals first",
    pct: "Biggest % off",
    saved: "Biggest $ saved",
    low: "Lowest price",
    high: "Highest price",
  })
    .map(([v, label]) => `<option value="${v}" ${v === state.sort ? "selected" : ""}>${label}</option>`)
    .join("");
  return `<section class="controls" aria-label="Search and filters">
  <label class="search">Search deals <input id="q" type="search" placeholder="Try “AirPods”, “TV”, “laptop”…" value="${escape(state.q)}"></label>
  <div class="cats" role="group" aria-label="Category">${cats}</div>
  <div class="row">
    <label>Store <select id="store">${storeOpts}</select></label>
    <label>Discount <select id="minPct">${minOpts}</select></label>
    <label>Sort <select id="sort">${sortOpts}</select></label>
    <label class="check"><input id="lowsOnly" type="checkbox" ${state.lowsOnly ? "checked" : ""}> Record lows only</label>
  </div>
</section>`;
}

export function listPage(deals, shown, state) {
  const s = stats(deals);
  return `<section class="hero">
  <p class="eyebrow">Black Friday · 27 Nov 2026 · Cyber Monday 30 Nov</p>
  <h1>Real Black Friday deals, checked today.</h1>
  <p class="lede">Every price below was read from a named source on 27 Nov 2026 and checked
  against its store. No placeholders, no invented prices — and an honest verdict on
  whether each one is really a deal.</p>
  <ul class="hero-stats">
    <li><b>${s.total}</b> deals checked</li>
    <li><b>${s.lows}</b> record lows</li>
    <li><b>${s.avgPct}%</b> average cut</li>
    <li><b>${usd(s.biggestSave.was - s.biggestSave.price)}</b> biggest saving</li>
  </ul>
</section>
${controls(state, deals)}
<p class="count"><b>${shown.length}</b> of ${deals.length} deals shown</p>
${shown.length === 0 ? '<p class="empty">No deal matches those filters. <a href="#/">Clear everything</a>.</p>' : `<div class="grid">${shown.map(card).join("")}</div>`}
<section class="method">
  <h2>How the prices were checked</h2>
  <p>Each deal names where its price was read — a deals roundup that names the store and
  the price, or the store's own Black Friday announcement — and the time it was checked.
  Prices move fast on Black Friday: always confirm the price at the store before you buy.
  The Deal Score mixes the size of the cut with how trustworthy the low is; a record low
  outranks a routine markdown of the same size.</p>
</section>`;
}

export function dealPage(d, all) {
  const others = all.filter((x) => x.id !== d.id && x.title === d.title);
  const compare = others.length
    ? `<section class="compare"><h2>Same product, other stores</h2>
  <table><thead><tr><th>Store</th><th>Price</th><th>Usual</th><th>Off</th><th></th></tr></thead><tbody>
  ${[d, ...others]
    .sort((a, b) => a.price - b.price)
    .map(
      (x) => `<tr class="${x.id === d.id ? "here" : ""}"><td>${escape(x.store)}</td><td><b>${usd(x.price)}</b></td><td>${usd(x.was)}</td><td>−${discountPct(x)}%</td><td><a href="${escape(x.url)}" rel="noopener" target="_blank">View ↗</a></td></tr>`,
    )
    .join("")}
  </tbody></table>
  <p>Cheapest first. The store link takes you to the product at that store.</p></section>`
    : "";
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top"><span class="cat">${escape(d.category)}</span>${verdictChip(d)}</div>
  <h1>${escape(d.title)}</h1>
  <p class="prices big"><span class="price">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="off">−${discountPct(d)}%</span></p>
  <p class="save">You save ${usd(saved(d))} · ${scoreBadge(d)}</p>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Verdict</dt><dd><b>${verdictLabel(d)}</b> — ${escape(d.why)}</dd>
    <dt>Checked</dt><dd>${day(d.checked)}</dd>
    <dt>Price read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="actions"><a class="btn big" href="${escape(d.url)}" rel="noopener" target="_blank">View at ${escape(d.store)} ↗</a></p>
</article>
${compare}`;
}

export function missingPage() {
  return `<h1>Not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
