const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = 8080;
const root = __dirname;
const votes = [];
const files = new Set(["index.html", "style.css", "script.js", "config.js"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 4096) reject(new Error("request too large"));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/api/votes" && request.method === "GET") {
    const room = (url.searchParams.get("room") || "우리 팀").trim().slice(0, 24);
    return sendJson(response, 200, votes.filter(vote => vote.room === room).map(({ menu }) => ({ menu })));
  }

  if (url.pathname === "/api/votes" && request.method === "POST") {
    try {
      const payload = JSON.parse(await readBody(request));
      const menu = typeof payload.menu === "string" ? payload.menu.trim() : "";
      const room = typeof payload.room === "string" ? payload.room.trim() : "";
      if (!menu || menu.length > 20 || !room || room.length > 24) {
        return sendJson(response, 400, { error: "invalid vote" });
      }
      votes.push({ menu, room });
      return sendJson(response, 201, { ok: true });
    } catch {
      return sendJson(response, 400, { error: "invalid request" });
    }
  }

  const fileName = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (!files.has(fileName)) return sendJson(response, 404, { error: "not found" });

  const filePath = path.join(root, fileName);
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(response, 500, { error: "unavailable" });
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(fileName)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY"
    });
    response.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Lunch roulette server listening on port ${port}.`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
