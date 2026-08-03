const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": status === 200 ? "public, max-age=300" : "no-store"
  });
  res.end(body);
}

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(root, clean === "/" ? "index.html" : clean);
  if (!target.startsWith(root)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || "/";
  if (urlPath === "/health") return send(res, 200, "ok");
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed");

  const file = resolveFile(urlPath);
  if (!file) return send(res, 403, "Forbidden");

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not Found");
    // 本地开发默认 no-store;部署环境设 CACHE=1 恢复强缓存
    const strongCache = process.env.CACHE === "1";
    res.writeHead(200, {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": !strongCache || file.endsWith("index.html")
        ? "no-store"
        : "public, max-age=31536000, immutable"
    });
    if (req.method === "HEAD") return res.end();
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`strategy-site listening on ${host}:${port}`);
});
