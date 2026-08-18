#!/usr/bin/env node
"use strict";

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res, parse(req.url || "/", true));
    }).listen(port, hostname, () => {
      console.log(`Ecom Resolutions listening on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start Ecom Resolutions", error);
    process.exit(1);
  });
