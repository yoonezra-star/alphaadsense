import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeQuery, searchDocuments, validDocument } from "../public/assets/search-engine.mjs";

const doc = (title, description = "", url = "/guides/test/", category = "자료") => ({ title, description, url, category });

test("search prioritizes exact, prefix and contained titles over descriptions", () => {
  const items = [doc("기타", "인증"), doc("소유권 인증 방법"), doc("인증 방법"), doc("인증")];
  assert.deepEqual(searchDocuments(items, "인증").map((item) => item.title), ["인증", "인증 방법", "소유권 인증 방법", "기타"]);
});
test("all search terms are required and title terms outrank mixed fields", () => {
  const items = [doc("인증", "도메인"), doc("도메인 연결"), doc("도메인 소유권 인증")];
  assert.deepEqual(searchDocuments(items, "도메인 인증").map((item) => item.title), ["도메인 소유권 인증", "인증"]);
});
test("normalization handles case, fullwidth, whitespace and decomposed Korean", () => {
  assert.equal(normalizeQuery("  ＲＰＭ \n 계산 "), "rpm 계산");
  assert.equal(searchDocuments([doc("인증 RPM")], "인증".normalize("NFD")).length, 1);
});
test("long descriptions remain searchable beyond query length limits", () => {
  assert.equal(searchDocuments([doc("자료", "가".repeat(200) + " 인증")], "인증").length, 1);
  assert.equal(normalizeQuery("a".repeat(200)).length, 120);
});
test("empty queries and unmatched terms return no results", () => {
  assert.deepEqual(searchDocuments([doc("인증")], "  "), []);
  assert.deepEqual(searchDocuments([doc("인증")], "없는검색어"), []);
});
test("invalid documents and external or script URLs are rejected", () => {
  for (const url of ["https://example.com/", "//example.com/", "/\\example.com/", "javascript:alert(1)"]) assert.equal(validDocument(doc("인증", "", url)), false);
  assert.equal(validDocument({ title: "인증" }), false);
  assert.equal(searchDocuments([null, doc("인증", "", "//example.com/"), doc("인증")], "인증").length, 1);
});
test("equal ranking preserves the curated source order without mutating it", () => {
  const items = [doc("첫 글", "인증"), doc("둘째 글", "인증")];
  assert.deepEqual(searchDocuments(items, "인증"), items);
  assert.equal(items[0].title, "첫 글");
});
