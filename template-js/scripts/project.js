var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  if (module2 && module2.__esModule)
    return module2;
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", {value: module2, enumerable: true})), module2);
};

// project-script/base.ts
var import_vite = __toModule(require("vite"));
var fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_esbuild = __toModule(require("esbuild"));
var chalk = __toModule(require("chalk"));
var Base = class {
  constructor() {
    this.root = import_path.join(__dirname, "../");
    this.pkg = import_path.join(this.root, "package.json");
    this.main = import_path.join(this.root, "src/main");
    this.render = import_path.join(this.root, "src/render");
    this.outDir = import_path.join(this.root, "dist");
    this.mainEntrySrc = "";
    this.mainEntry = "";
    this.outFlag = {
      vite: chalk.green(`[vite] `),
      electron: chalk.blue(`[electron] `),
      control: chalk.rgb(190, 33, 64)(`[control] `)
    };
  }
  async init() {
    let pkg;
    try {
      pkg = require(this.pkg);
    } catch (error) {
      console.error(error);
      process.exit();
    }
    if (pkg.main) {
      this.mainEntrySrc = import_path.join(this.root, pkg.main);
    } else {
      for (const file of fs.readdirSync(this.main)) {
        if (file.startsWith("entry")) {
          this.mainEntrySrc = import_path.join(this.main, file);
          break;
        }
      }
    }
    const viteConfig = await import_vite.resolveConfig({}, "build");
    this.outDir = viteConfig.build.outDir;
    this.mainEntry = import_path.join(this.outDir, "__entry.js");
  }
  buildMain(isDev = true) {
    if (isDev)
      process.env.CVE_ENV = "development";
    return import_esbuild.buildSync({
      bundle: true,
      entryPoints: [this.mainEntrySrc],
      external: ["electron"],
      platform: "node",
      minify: isDev ? false : true,
      outfile: this.mainEntry
    });
  }
};

// project-script/dev.ts
var import_vite2 = __toModule(require("vite"));
var chalk2 = __toModule(require("chalk"));
var import_fs = __toModule(require("fs"));
var import_child_process = __toModule(require("child_process"));
var import_chokidar = __toModule(require("chokidar"));
var Dev = class extends Base {
  constructor() {
    super(...arguments);
    this.isReStart = false;
  }
  async runRender() {
    let config = await import_vite2.resolveConfig({}, "serve");
    this.port = config.server.port ? config.server.port : 3e3;
    this.viteServer = await import_vite2.createServer({
      server: {port: this.port}
    });
    let httpServer = this.viteServer.httpServer;
    if (httpServer != null) {
      return new Promise((resolve) => {
        const onError = (e) => {
          if (e.code === "EADDRINUSE") {
            if (config.server.strictPort) {
              console.error(chalk2.red`[viteError] Port ${this.port} is already in use`);
              process.exit();
            } else {
              console.log(this.outFlag.vite + `Port ${this.port} is in use, trying another one...`);
              httpServer.listen(++this.port);
            }
          } else {
            console.error(chalk2.red`[viteError] ${e}`);
            process.exit();
          }
        };
        httpServer.on("error", onError);
        httpServer.listen(this.port, () => {
          httpServer.removeListener("error", onError);
          console.log(this.outFlag.vite + `Dev server running at:${this.port}`);
          resolve("");
        });
      });
    } else {
      console.error(chalk2.red`[viteError] httpServer Create a failure`);
    }
  }
  async runElectron() {
    await this.init().catch((e) => {
      console.error(chalk2.red`[contorlError] init failed:\n${e}`);
    });
    this.buildMain();
    let _electron;
    try {
      _electron = require("electron");
    } catch (error) {
      console.error(error);
      process.exit();
    }
    this.electron = import_child_process.spawn(_electron.toString(), [this.mainEntry]);
    this.electron.on("close", () => {
      if (this.isReStart) {
        this.isReStart = false;
        this.runElectron();
      } else {
        this.viteServer.close();
        process.exit();
      }
    });
    process.on("exit", () => {
      if (import_fs.existsSync(this.outDir)) {
        import_fs.rmdirSync(this.outDir, {recursive: true});
      }
    });
    this.electron.stdout.on("data", (chunk) => {
      let data = chunk.toString();
      if (data.trim().length > 0) {
        console.log(this.outFlag.electron + `${chunk.toString()}`);
      }
    });
    console.log(this.outFlag.control + `Start time: ${Date.now() - this.oldTime}ms`);
  }
  mainHMR() {
    import_chokidar.watch(this.main).on("change", () => {
      console.log(this.outFlag.control + `entry file change.restart at ${new Date()}`);
      this.isReStart = true;
      this.electron.kill();
      this.oldTime = Date.now();
    });
  }
  async run() {
    this.oldTime = Date.now();
    await this.runRender();
    process.env.CVE_PORT = this.port + "";
    await this.runElectron();
    this.mainHMR();
  }
};

// project-script/build.ts
var import_vite3 = __toModule(require("vite"));
var import_fs2 = __toModule(require("fs"));
var import_electron_builder = __toModule(require("electron-builder"));
var import_path2 = __toModule(require("path"));
var chalk3 = __toModule(require("chalk"));
var Build = class extends Base {
  async buildRender() {
    await import_vite3.build();
  }
  getMIRROR() {
    let ELECTRON_MIRROR = "";
    let npmrc = import_path2.join(this.root, ".npmrc");
    if (import_fs2.existsSync(npmrc)) {
      ELECTRON_MIRROR = import_fs2.readFileSync(npmrc).toString();
      let _t = ELECTRON_MIRROR.split(/[(\r\n)\r\n]+/);
      for (let i = 0; i < _t.length; i++) {
        let key = _t[i].split("=");
        if (key[0] == "ELECTRON_MIRROR") {
          ELECTRON_MIRROR = key[1];
          break;
        }
      }
    }
    return ELECTRON_MIRROR;
  }
  async buildProject() {
    import_fs2.mkdirSync(import_path2.join(this.outDir, "node_modules"));
    let MIRROR = this.getMIRROR();
    await import_electron_builder.build({
      projectDir: this.outDir,
      config: {
        directories: {
          output: import_path2.join(this.root, "release")
        },
        extends: null,
        electronDownload: {
          mirror: MIRROR
        }
      }
    });
  }
  mkPkgJson() {
    let pkg;
    try {
      pkg = require(this.pkg);
    } catch (error) {
      console.error(error);
      process.exit();
    }
    if (!pkg.main) {
      pkg.main = "__entry.js";
    }
    let electronVersion = pkg.devDependencies.electron.replace("^", "");
    delete pkg.scripts;
    delete pkg.dependencies;
    delete pkg.devDependencies;
    pkg.devDependencies = {electron: electronVersion};
    import_fs2.writeFileSync(import_path2.join(this.outDir, "package.json"), JSON.stringify(pkg, null, 2));
    return pkg;
  }
  async run() {
    await this.init().catch((e) => {
      console.error(chalk3.red`[contorlError] init failed:\n${e}`);
    });
    await this.buildRender();
    this.buildMain();
    this.mkPkgJson();
    await this.buildProject().catch((e) => {
      console.error(chalk3.red`[electronBuilderError] \n${e}`);
      process.exit();
    });
    console.log(this.outFlag.control + ` The packaged application is complete`);
  }
};

// project-script/index.ts
var method = process.argv.slice(2)[0];
async function init() {
  switch (method) {
    case "build":
      await new Build().run();
      break;
    case "dev":
      await new Dev().run();
      break;
    default:
      console.log(`The argument should be dev or build`);
  }
}
init().catch((e) => {
  console.log(e);
});
