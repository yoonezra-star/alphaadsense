import assert from "node:assert/strict";
import { test } from "node:test";

let sequence = 0;
const settle = () => new Promise((resolve) => setImmediate(resolve));

async function fixture(fetcher, query = "") {
  const elements = new Map();
  const listeners = new Map();
  class Element {
    constructor() { this.children = []; this.handlers = {}; this.value = ""; this.hidden = false; this.disabled = false; this.attributes = {}; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.handlers[name] = handler; }
    focus() { document.activeElement = this; }
  }
  globalThis.document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); },
    createElement() { return new Element(); }
  };
  globalThis.location = { pathname: "/search/", search: query };
  globalThis.history = { pushState(_state, _title, path) { const url = new URL(path, "https://alphaadsense.com"); location.search = url.search; } };
  globalThis.window = { addEventListener(name, handler) { listeners.set(name, handler); } };
  globalThis.fetch = fetcher;
  await import(`../public/assets/site-search.mjs?test=${++sequence}`);
  await settle();
  return { get: (id) => elements.get(id), listeners };
}

test("search controller exposes fetch errors and recovers through its retry control", async () => {
  let fail = true;
  const { get } = await fixture(async () => {
    if (fail) throw new Error("Network unavailable");
    return { ok: true, json: async () => [] };
  });
  assert.equal(get("search-error").hidden, false);
  assert.equal(get("search-retry").hidden, false);
  assert.equal(get("search-submit").disabled, true);
  assert.equal(get("search-results").attributes["aria-busy"], "false");
  fail = false;
  await get("search-retry").handlers.click();
  assert.equal(get("search-error").hidden, true);
  assert.equal(get("search-submit").disabled, false);
  assert.equal(get("search-summary").textContent, "검색어를 입력하세요.");
});

test("search controller rejects malformed index responses", async () => {
  const { get } = await fixture(async () => ({ ok: true, json: async () => [{ title: "불완전" }] }));
  assert.equal(get("search-error").hidden, false);
  assert.equal(get("search-results").children.length, 0);
});

test("pagination retains the submitted query and history restores its page", async () => {
  const items = Array.from({ length: 23 }, (_, i) => ({ title: `인증 ${i}`, description: "설명", category: "자료", url: `/guides/${i}/` }));
  const { get, listeners } = await fixture(async () => ({ ok: true, json: async () => items }), "?q=인증");
  assert.equal(get("search-results").children.length, 10);
  assert.equal(get("search-previous").disabled, true);
  get("site-search").value = "아직 제출하지 않은 검색어";
  get("search-next").handlers.click();
  assert.equal(new URLSearchParams(location.search).get("q"), "인증");
  assert.equal(get("search-summary").textContent, "총 23개 · 11–20번째 결과");
  get("search-next").handlers.click();
  assert.equal(get("search-results").children.length, 3);
  assert.equal(get("search-next").disabled, true);
  location.search = "?q=인증";
  listeners.get("popstate")();
  assert.equal(get("search-page-number").textContent, "1 / 3");
  get("site-search").value = "없는검색어";
  get("site-search-form").handlers.submit({ preventDefault() {} });
  assert.equal(get("search-summary").textContent, "일치하는 문서가 없습니다.");
  assert.equal(document.activeElement, get("search-summary"));
});
