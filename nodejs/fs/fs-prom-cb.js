import Benchmark from "benchmark"
import fs from "fs"
import path from "path"
import chalk from "chalk"
import util from "util"
const promisifed = util.promisify(fs.readFile);

const bigFilepath = "./1MB.txt"

const suite = new Benchmark.Suite("fs");

suite
  .add(
    "fs.readFileSync",
    (defer) => {
      fs.readFileSync(bigFilepath, "utf8");
      defer.resolve();
    },
    { defer: true }
  )
  .add(
    "fs.readFile",
    (defer) => {
      fs.readFile(bigFilepath, (err, data) => {
        defer.resolve();
      });
    },
    { defer: true }
  )
  .add(
    "fs.promises.readFile",
    (defer) => {
      fs.promises.readFile(bigFilepath).then(() => {
        defer.resolve();
      });
    },
    { defer: true }
  )
  .add(
    "util.promisify(fs.readFile)",
    (defer) => {
      promisifed(bigFilepath).then(() => {
        defer.resolve();
      });
    },
    { defer: true }
  )
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log(
      "Fastest is " + chalk.green(this.filter("fastest").map("name"))
    );
    console.log("Slowest is " + chalk.red(this.filter("slowest").map("name")));
  })
  .run({ defer: true });
