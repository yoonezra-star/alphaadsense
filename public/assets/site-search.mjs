import { normalizeQuery, searchDocuments, validDocument } from "./search-engine.mjs";

const form = document.getElementById("site-search-form");
const input = document.getElementById("site-search");
const results = document.getElementById("search-results");
const summary = document.getElementById("search-summary");
const error = document.getElementById("search-error");
const retry = document.getElementById("search-retry");
const pager = document.getElementById("search-pagination");
const previous = document.getElementById("search-previous");
const next = document.getElementById("search-next");
const submit = document.getElementById("search-submit");
const pageSize = 10;
let documents = [];
let ready = false;
let currentPage = 1;
let pageCount = 1;
let requestId = 0;
let activeQuery = "";

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function render(query, page = 1, focus = false) {
  const q = normalizeQuery(query);
  activeQuery = query.slice(0, 120);
  input.value = query.slice(0, 120);
  results.replaceChildren();
  error.hidden = true;
  const matches = searchDocuments(documents, q);
  pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  currentPage = Number.isSafeInteger(page) ? Math.min(pageCount, Math.max(1, page)) : 1;
  pager.hidden = !q || matches.length <= pageSize;
  previous.disabled = currentPage === 1;
  next.disabled = currentPage === pageCount;
  document.getElementById("search-page-number").textContent = `${currentPage} / ${pageCount}`;
  if (!q) summary.textContent = "검색어를 입력하세요.";
  else if (!matches.length) summary.textContent = "일치하는 문서가 없습니다.";
  else {
    const start = (currentPage - 1) * pageSize;
    const visible = matches.slice(start, start + pageSize);
    summary.textContent = `총 ${matches.length}개 · ${start + 1}–${start + visible.length}번째 결과`;
    for (const item of visible) {
      const article = node("article", undefined, "search-result");
      const heading = node("h2");
      const link = node("a", item.title);
      link.href = item.url;
      heading.append(link);
      const excerpt = item.description.length > 180 ? item.description.slice(0, 180) + "…" : item.description;
      article.append(node("p", item.category, "eyebrow"), heading, node("p", excerpt));
      results.append(article);
    }
  }
  if (focus) summary.focus();
}

function fromLocation(focus = false) {
  const params = new URLSearchParams(location.search);
  render(params.get("q") || "", Number(params.get("page") || "1"), focus);
}

function navigate(query, page = 1) {
  const params = new URLSearchParams();
  const q = query.trim().slice(0, 120);
  if (q) params.set("q", q);
  if (q && page > 1) params.set("page", String(page));
  const url = `/search/${params.size ? "?" + params.toString() : ""}`;
  if (location.pathname + location.search !== url) history.pushState(null, "", url);
  render(q, page, true);
}

async function load() {
  const request = ++requestId;
  ready = false;
  input.disabled = true;
  submit.disabled = true;
  retry.hidden = true;
  error.hidden = true;
  pager.hidden = true;
  results.replaceChildren();
  results.setAttribute("aria-busy", "true");
  summary.textContent = "문서를 불러오는 중입니다.";
  try {
    const response = await fetch("/search-index.json");
    if (!response.ok) throw new Error("Search index request failed");
    const items = await response.json();
    if (!Array.isArray(items) || !items.every(validDocument)) throw new Error("Invalid search index");
    if (request !== requestId) return;
    documents = items;
    ready = true;
    input.disabled = false;
    submit.disabled = false;
    fromLocation();
  } catch {
    if (request !== requestId) return;
    summary.textContent = "검색을 사용할 수 없습니다.";
    error.textContent = "문서 목록을 불러오지 못했습니다. 잠시 후 다시 시도하거나 전체 글 목록을 확인하세요.";
    error.hidden = false;
    retry.hidden = false;
  } finally {
    if (request === requestId) results.setAttribute("aria-busy", "false");
  }
}

form.addEventListener("submit", (event) => { event.preventDefault(); if (ready) navigate(input.value); });
previous.addEventListener("click", () => navigate(activeQuery, currentPage - 1));
next.addEventListener("click", () => navigate(activeQuery, currentPage + 1));
retry.addEventListener("click", load);
window.addEventListener("popstate", () => { if (ready) fromLocation(); });
input.value = (new URLSearchParams(location.search).get("q") || "").slice(0, 120);
load();
