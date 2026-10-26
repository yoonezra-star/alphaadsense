function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

export function normalizeQuery(value) {
  return normalizeText(value).slice(0, 120);
}

export function validDocument(item) {
  if (!item || !["title", "description", "category", "url"].every((key) => typeof item[key] === "string")) return false;
  if (!item.url.startsWith("/") || item.url.startsWith("//")) return false;
  try {
    return new URL(item.url, "https://alphaadsense.com").origin === "https://alphaadsense.com";
  } catch {
    return false;
  }
}

export function searchDocuments(items, query) {
  const q = normalizeQuery(query);
  if (!q) return [];
  const terms = [...new Set(q.split(" "))];
  return items.filter(validDocument).map((item, index) => {
    const title = normalizeText(item.title);
    const description = normalizeText(item.description);
    const category = normalizeText(item.category);
    const combined = `${title} ${description} ${category}`;
    if (!terms.every((term) => combined.includes(term))) return { item, index, score: 0 };
    let score = 100;
    if (title === q) score = 10000;
    else if (title.startsWith(q)) score = 9000;
    else if (title.includes(q)) score = 8000;
    else if (terms.every((term) => title.includes(term))) score = 7000;
    else score += terms.filter((term) => title.includes(term)).length * 100;
    if (category.includes(q)) score += 20;
    return { item, index, score };
  }).filter((match) => match.score > 0).sort((left, right) => right.score - left.score || left.index - right.index).map((match) => match.item);
}
