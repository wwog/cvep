import { resolveConfig } from 'vite'
import * as fs from 'fs'
import { join } from 'path'
import { buildSync } from 'esbuild'
import * as chalk from 'chalk'

export class Base {
  protected readonly root = join(__dirname, '../')
  protected readonly pkg = join(this.root, 'package.json')
  protected readonly main = join(this.root, 'src/main')
  protected readonly render = join(this.root, 'src/render')
  protected outDir = join(this.root, 'dist')
  protected mainEntrySrc = '';
  protected mainEntry = '';
  protected readonly outFlag = {
    vite: chalk.green(`[vite] `),
    electron: chalk.blue(`[electron] `),
    control: chalk.rgb(190, 33, 64)(`[control] `)
  }
  protected async init() {
    let pkg
    try {
      pkg = require(this.pkg)
    }catch(error){
      console.error(error)
      process.exit();
    }
    //main入口,首先根据pkgJson为主，如果没有则在main目录寻找entry文件
    if (pkg.main) {
      this.mainEntrySrc = join(this.root, pkg.main)
    } else {
      let isFind = false
      for (const file of fs.readdirSync(this.main)) {
        if (file.startsWith('entry')) {
          isFind = true;
          this.mainEntrySrc = join(this.main, file)
          break
        }
      }
      if(!isFind){
        console.error(new Error(`not find electron mainProcess Entry file!!!`))
      }
    }
    //outDir,vite默认为dist
    const viteConfig = await resolveConfig({}, 'build')
    this.outDir = viteConfig.build.outDir
    //mainOut
    this.mainEntry = join(this.outDir, '__entry.js')
  }
  protected buildMain(isDev = true) {
    if (isDev) process.env.CVE_ENV = 'development'
    return buildSync({
      bundle: true,
      entryPoints: [this.mainEntrySrc],
      external: ['electron'],
      platform: 'node',
      minify: isDev ? false : true,
      outfile: this.mainEntry
    })
  }
}
export function isObject(arg: any) {
  return arg !== null && Object.prototype.toString.call(arg) === '[object Object]'
}

export function isArray(arg: any) {
  return Array.isArray(arg)
}

export function mergeObject(target: any, ...arg: any[]) {
  return arg.reduce((acc, cur) => {
    return Object.keys(cur).reduce((subAcc, key) => {
      const srcVal = cur[key]
      if (isObject(srcVal)) {
        subAcc[key] = mergeObject(subAcc[key] ? subAcc[key] : {}, srcVal)
      } else if (isArray(srcVal)) {
        subAcc[key] = srcVal.map((item: any, idx: number) => {
          if (isObject(item)) {
            const curAccVal = subAcc[key] ? subAcc[key] : []
            return mergeObject(curAccVal[idx] ? curAccVal[idx] : {}, item)
          } else {
            return item
          }
        })
      } else {
        subAcc[key] = srcVal
      }
      return subAcc
    }, acc)
  }, target)
}