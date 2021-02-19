import * as path from "path";
import * as fs from 'fs';
import { copy, emptyDir } from './utils';
import { join } from "path";
let cwd = process.cwd();
export class Project {
  public root: string;
  private viteTemplate!: string;
  protected packagePath: string;
  protected createAppDir = path.join(__dirname, '../../node_modules', '@vitejs/create-app')
  protected templateDir = '';
  static ADDITEMS = [
    'npmrc',
  ]
  constructor(public projectName: string) {
    this.root = join(cwd, projectName)
    this.packagePath = join(this.root, 'package.json')
  }
  async create(language: 'js' | 'ts' = 'ts', existHandle: any) {
    let dirName = ''
    if (language == 'js') {
      dirName = 'template-vue'
    } else {
      dirName = 'template-vue-ts'
    }
    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root, { recursive: true })
    } else {
      await existHandle()
    }
    //将vite模板输出文件夹
    this.viteTemplate = path.join(this.createAppDir, dirName)
    let files = fs.readdirSync(this.viteTemplate)
    for (const file of files) {
      this.write(file)
    }
    this.cleanUnwantedFiles()
    this.engineering()
    //将项目模板输出到文件夹
    this.templateDir = path.join(__dirname, `../../template-${language}`)
    files = fs.readdirSync(this.templateDir)
    for (const file of files) {
      this.write(file, undefined, this.templateDir)
    }
    //重写pkg
    let pkgData = require(this.packagePath)
    pkgData.name = this.projectName.toLowerCase()
    pkgData.devDependencies['electron'] = '^11.2.3'
    pkgData.devDependencies['chalk'] = '^4.1.0'
    pkgData.devDependencies['esbuild'] = '^0.8.34'
    pkgData.devDependencies['electron-builder'] = '^22.9.1'
    pkgData.devDependencies['chokidar'] = '^3.5.1'
    pkgData.scripts['vite_dev']=pkgData.scripts['dev']
    pkgData.scripts['vite_build']=pkgData.scripts['build']
    pkgData.scripts['dev'] = "node ./scripts/project.js dev"
    pkgData.scripts['build'] = "node ./scripts/project.js build"
    fs.writeFileSync(this.packagePath, JSON.stringify(pkgData, null, 2))
  }
  addItem(itemArr: string[]) {
    for (const item of itemArr) {
      //@ts-ignore
      if (this[item]) {
        //@ts-ignore
        this[item]()
      }
    }
  }
  private write(file: string, content: any = undefined, templateDir = this.viteTemplate) {
    //@ts-ignore
    const targetPath = renameFiles[file]
      //@ts-ignore
      ? path.join(this.root, renameFiles[file])
      : path.join(this.root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }
  private cleanUnwantedFiles() {
    fs.unlinkSync(join(this.root, 'index.html'))
    emptyDir(join(this.root, 'public'))
    fs.rmdirSync(join(this.root, 'public'))
  }
  private engineering() {
    let oldPath = join(this.root, 'src')
    let tempPath = join(this.root, 'render')
    let newPath = join(this.root, 'src/render')
    fs.renameSync(oldPath, tempPath)
    fs.mkdirSync(oldPath)
    fs.renameSync(tempPath, newPath)
  }
  private npmrc() {
    let fileData = 'ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/\nELECTRON_BUILDER_BINARIES_MIRROR=http://npm.taobao.org/mirrors/electron-builder-binaries/'
    this.write('.npmrc', fileData)
  }
  private elementPlus() {
    let pkgData = require(this.packagePath)
    pkgData.dependencies['element-plus'] = 'latest'
    fs.writeFileSync(this.packagePath, JSON.stringify(pkgData, null, 2))
  }
}
const renameFiles = {
  _gitignore: '.gitignore'
}