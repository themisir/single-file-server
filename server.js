// Copyright © 2021 Misir Jafarov <misir.ceferov@gmail.com>
// This work is free. You can redistribute it and/or modify it under the
// terms of the Do What The Fuck You Want To Public License, Version 2,
// as published by Sam Hocevar. See the LICENSE file for more details.

const { createServer } = require("http");
const fs = require("fs/promises");

const port = parseInt(process.env.PORT) || 8000;
const cacheLifetime = parseInt(process.env.CACHE_LIFETIME) || 60000;
const filePath = process.env.DATA_FILE;
const headers = process.env.HEADERS
  ? Object.fromEntries(process.env.HEADERS.split("|").map((e) => e.split(":")))
  : undefined;

if (!filePath) {
  console.error("File path is not provided");
  process.exit(1);
}

let cachedData = {
  cachedUntil: 0,
  data: undefined,
};

async function getData() {
  if (cachedData.data && cachedData.cachedUntil > Date.now()) {
    return cachedData.data;
  }

  cachedData.data = await fs.readFile(filePath, "utf-8");
  cachedData.cachedUntil = Date.now() + cacheLifetime;

  return cachedData.data;
}

createServer(async (req, res) => {
  if (req.method === "GET" && req.url && req.url.split("?")[0] === "/") {
    try {
      const data = await getData();
      if (headers) {
        for (const key in headers) {
          res.setHeader(key, headers[key]);
        }
      }
      res.flushHeaders();
      res.write(data);
      res.end();
    } catch (error) {
      res.statusCode = 500;
      res.statusMessage = "Internal Error";
      console.error(error);
    } finally {
      res.end();
    }
  } else {
    res.statusCode = 404;
    req.statusMessage = "Not Found";
    res.end();
  }
}).listen(port, () => {
  console.log(`Listening on http://127.0.0.1:${port}`);
});
