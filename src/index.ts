import { Project } from "./lib/project";
import { prompt } from "enquirer"
import * as parseArgv from "minimist"
import * as fs from 'fs'
import { emptyDir } from './lib/utils'
let argv = parseArgv.default(process.argv.slice(2), {
  alias: {
    j: ['J', 'javascript'],
    t: ['T', 'typescript'],
  }
})
const TEMPLATES = [
  'ts',
  'js',
]
const ADDITEMS = [
  'npmrc',
]
async function init() {
  let projectName = argv._[0]
  if (!projectName) {
    const { name }: any = await prompt({
      type: 'input',
      name: 'name',
      message: `Project name:`,
      initial: 'electronApp'
    })
    projectName = name
  }
  let project = new Project(projectName)
  type _t = 'js' | 'ts' | undefined
  let template: _t = argv.j ? 'js' : argv.t ? 'ts' : undefined
  if (!template) {
    const { t }: any = await prompt({
      type: 'select',
      name: 't',
      message: `Select a template:`,
      choices: TEMPLATES
    })
    template = t
  }
  await project.create(template, async () => {
    const existing = fs.readdirSync(project.root)
    if (existing.length) {
      const { yes }: any = await prompt({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message:
          `Target directory ${projectName} is not empty.\n` +
          `Remove existing files and continue?`
      })
      if (yes) {
        emptyDir(project.root)
      } else {
        return
      }
    }
  })
  const { addItems }: { addItems: any[] } = await prompt({
    type: 'multiselect',
    name: 'addItems',
    message: 'Select addItems:',
    initial: 0,
    choices: ADDITEMS
  })
  project.addItem(addItems)
}

init().catch(e => { console.log(e) })