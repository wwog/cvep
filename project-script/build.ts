import { Base } from "./base";
import { build as viteBuild } from "vite";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { build as electronBuild } from "electron-builder";
import { join } from "path";
import * as chalk from 'chalk'

export class Build extends Base {
  private async buildRender() {
    await viteBuild()
  }
  private getMIRROR() {
    //npmrc  ELECTRON_MIRROR
    let ELECTRON_MIRROR = ''
    let npmrc = join(this.root, '.npmrc')
    if (existsSync(npmrc)) {
      ELECTRON_MIRROR = readFileSync(npmrc).toString()
      let _t = ELECTRON_MIRROR.split(/[(\r\n)\r\n]+/)
      for (let i = 0; i < _t.length; i++) {
        let key = _t[i].split('=')
        if (key[0] == 'ELECTRON_MIRROR') {
          ELECTRON_MIRROR = key[1]
          break;
        }
      }
    }
    return ELECTRON_MIRROR
  }
  private async buildProject() {
    mkdirSync(join(this.outDir, "node_modules"));
    let MIRROR = this.getMIRROR()
    await electronBuild({
      projectDir: this.outDir,
      config: {
        directories: {
          output: join(this.root, "release"),
        },
        extends: null,
        electronDownload: {
          mirror: MIRROR
        },
      }
    })
  }
  private mkPkgJson() {
    let pkg
    try {
      pkg = require(this.pkg);
    } catch (error) {
      console.error(error)
      process.exit()
    }
    
    if (!pkg.main) {
      pkg.main = '__entry.js'
    }
    let electronVersion = pkg.dependencies.electron.replace("^", "");
    delete pkg.scripts;
    delete pkg.dependencies;
    delete pkg.devDependencies;
    pkg.dependencies = { electron: electronVersion };
    writeFileSync(
      join(this.outDir, "package.json"),
      JSON.stringify(pkg, null, 2),
    );
    return pkg;
  }
  async run() {
    await this.init().catch(e => {
      console.error(chalk.red`[contorlError] init failed:\n${e}`)
    })
    await this.buildRender()
    this.buildMain()
    this.mkPkgJson()
    await this.buildProject().catch(e => {
      console.error(chalk.red`[electronBuilderError] \n${e}`)
      process.exit()
    })
    console.log(this.outFlag.control + ` The packaged application is complete`)
  }
}