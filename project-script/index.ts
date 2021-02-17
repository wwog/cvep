import { Dev } from './dev'
import { Build } from './build'
let method = process.argv.slice(2)[0]
async function init() {
  switch (method) {
    case 'build':
      await new Build().run()
      break;
    case 'dev':
      await new Dev().run()
      break;
    default: 
      console.log(`The argument should be dev or build`)
  }
}

init().catch(e => {
  console.log(e)
})