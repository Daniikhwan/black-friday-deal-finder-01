// DealHound: routes and the filter controls.
//
//   #/                 the deal list, filters carried in the hash query
//   #/?q=airpods       the list, pre-searched (a linkable filtered view)
//   #/deal/<id>        one deal, with its cross-store comparison
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from "./data.js";
import { applyFilters, defaultState, parseHash, toHash } from "./filters.js";
import { dealPage, listPage, missingPage } from "./views.js";

const app = document.getElementById("app");

function renderList(state) {
  const shown = applyFilters(deals, state);
  document.title = "DealHound — Black Friday Deal Finder";
  app.innerHTML = listPage(deals, shown, state);
  const q = app.querySelector("#q");
  const store = app.querySelector("#store");
  const minPct = app.querySelector("#minPct");
  const sort = app.querySelector("#sort");
  const lowsOnly = app.querySelector("#lowsOnly");
  const go = (patch) => {
    const next = { ...state, ...patch };
    location.hash = toHash(next);
  };
  let timer = 0;
  q.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => go({ q: q.value }), 250);
  });
  store.addEventListener("change", () => go({ store: store.value }));
  minPct.addEventListener("change", () => go({ minPct: Number(minPct.value) }));
  sort.addEventListener("change", () => go({ sort: sort.value }));
  lowsOnly.addEventListener("change", () => go({ lowsOnly: lowsOnly.checked }));
  app.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => go({ category: b.dataset.cat })),
  );
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : "Not found"} | DealHound`;
    app.innerHTML = found ? dealPage(found, deals) : missingPage();
  } else {
    renderList(parseHash(location.hash));
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
