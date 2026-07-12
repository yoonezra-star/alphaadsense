import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

spawnSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });

const root = resolve("dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png"
};

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const clean = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  let file = join(root, clean);
  if (url.pathname.endsWith("/")) file = join(root, clean, "index.html");
  if (!existsSync(file) && !extname(file)) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Alpha AdSense local preview: http://localhost:${port}`);
});
