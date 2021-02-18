const { buildSync } = require('esbuild')
const path = require('path')
const fs = require('fs')

let root = path.join(__dirname, '../')

function buildProjectScript() {
  let templateJs = path.join(root, 'template-js/scripts/project.js')
  let result = buildSync({
    platform: 'node',
    bundle: true,
    entryPoints: [path.join(root, 'project-script/index.ts')],
    treeShaking: 'ignore-annotations',
    external: [
      'vite', 'chalk', 'fs', 'child_process',
      'chokidar', 'http', 'electron-builder', 'path',
      'esbuild'
    ],
    outfile: templateJs,
    minify: false
  })
  if (result.warnings.length === 0) {
    fs.copyFileSync(templateJs, templateJs.replace('-js', '-ts'))
    return true
  }
  return false
}

buildProjectScript()