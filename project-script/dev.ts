import { Base } from './base'
import { resolveConfig, createServer, ViteDevServer } from 'vite'
import * as chalk from 'chalk'
import { existsSync, rmdirSync } from 'fs'
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { watch } from "chokidar";
import { Server } from 'http';

export class Dev extends Base {
  private port!: number;
  private viteServer!: ViteDevServer;
  private electron!: ChildProcessWithoutNullStreams;
  private isReStart = false
  private oldTime!: number;
  private async runRender() {
    let config = await resolveConfig({}, 'serve')
    this.port = config.server.port ? config.server.port : 3000
    this.viteServer = await createServer({
      server: { port: this.port }
    }) as ViteDevServer
    let httpServer = this.viteServer.httpServer as Server
    if (httpServer != null) {
      return new Promise(resolve => {
        const onError = (e: Error & { code?: string }) => {
          if (e.code === 'EADDRINUSE') {
            if (config.server.strictPort) {
              console.error(chalk.red`[viteError] Port ${this.port} is already in use`)
              process.exit()
            } else {
              console.log(this.outFlag.vite + `Port ${this.port} is in use, trying another one...`);
              httpServer.listen(++this.port)
            }
          } else {
            console.error(chalk.red`[viteError] ${e}`)
            process.exit()
          }
        }
        httpServer.on('error', onError)
        httpServer.listen(this.port, () => {
          httpServer.removeListener('error', onError)
          console.log(this.outFlag.vite + `Dev server running at:${this.port}`)
          resolve('')
        })
      })
    } else {
      console.error(chalk.red`[viteError] httpServer Create a failure`)
    }
  }
  private async runElectron() {
    await this.init().catch(e => {
      console.error(chalk.red`[contorlError] init failed:\n${e}`)
    })
    this.buildMain()
    let _electron
    try {
      _electron = require('electron')
    } catch (error) {
      console.error(error)
      process.exit();
    }
    this.electron = spawn(_electron.toString(), [this.mainEntry])
    this.electron.on('close', () => {
      if (this.isReStart) {
        this.isReStart = false
        this.runElectron()
      } else {
        this.viteServer.close()
        process.exit()
      }
    })
    process.on('exit', () => {
      if (existsSync(this.outDir)) {
        rmdirSync(this.outDir, { recursive: true })
      }
    })
    this.electron.stdout.on('data', chunk => {
      let data = chunk.toString() as string
      if (data.trim().length > 0) {
        console.log(this.outFlag.electron + `${chunk.toString()}`)
      }
    })
    console.log(this.outFlag.control + `Start time: ${Date.now() - this.oldTime}ms`)
  }
  private mainHMR() {
    watch(this.main).on('change', () => {
      console.log(this.outFlag.control + `entry file change.restart at ${new Date()}`)
      this.isReStart = true
      this.electron.kill()
      this.oldTime = Date.now()
    })
  }
  async run() {
    this.oldTime = Date.now()
    await this.runRender()
    process.env.CVE_PORT = this.port + ''
    await this.runElectron()
    this.mainHMR()
  }
}
//test
//new Dev().run()