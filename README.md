# CVE

### Create the Electron project based on the next generation development server vite and vue3.

> Project use vite2.0,vue3, and the latest electron.Additional items to be added such as ElementPlus, Vuex, etc.
>
> **Compatibility Note:** Vite requires [Node.js](https://nodejs.org/en/) version >=12.0.0.

#### >Use

With NPM:

```
$ npm install cvep -g
```

With Yarn:

```
$ yarn global add cvep 
```

Then follow the prompts!

```
cvep		//Follow the flow
```

or

```
cvep <projectName> -<arg>
```

| arg                | description                         |
| ------------------ | ----------------------------------- |
| -J \| --javascript | Based on Javascript create  Project |
| -T \| --typescript | Based on typescript create  Project |

At this point the project is created！

#### >Dev And Build

Use ViteConfig to build and develop the VUE !!!

Use the PackageJson Build attribute to package the project !!!

With NPM:

```
$ npm run dev 
$ npm run build
```

With Yarn:

```
$ yarn dev 
$ yarn build
```

