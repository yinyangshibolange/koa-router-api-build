import fs from "fs"
import path from "path"
import {type RouterContext} from "koa-router"

function isArrayEmpty(arr) {
 return !(Array.isArray(arr) && arr.length > 0)
}

interface Api {
 index: string;
 method: string;
 handler: (ctx: RouterContext) => {}
}

export class ApiBuild  {
 apiRoot = ''
 base = ''
 apis: Api[] = []
 constructor(apiRoot: string, base?: string) {
  this.apiRoot = apiRoot
  if (typeof base === 'string') {
   this.base = base
  } else {
   this.base = path.parse(apiRoot).base
  }
 }

 async genApis() {
  this.apis = []
  await this.readApis()
 }

 async readApis(dir = '') {
  const root = this.apiRoot
  const apiPath = path.resolve(root, dir)
  const files = await fs.promises.readdir(apiPath)
  if (isArrayEmpty(files)) {
   return []
  }
  for (let k = 0; k < files.length; k++) {
   const filepath = path.resolve(root, dir, files[k])
   const stat = await fs.promises.stat(filepath)
   if (stat.isFile()) {
    const handler = await import('file://' + filepath)
    this.apis.push({
     index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
     method: handler.method,
     handler: handler.handler
    })
   } else if (stat.isDirectory()) {
    await this.readApis(dir ? (dir + '/' + files[k]) : files[k])
   }
  }
 }
}

// const apiBuild = new ApiBuild(path.resolve(process.cwd(), "../src/api"))

// apiBuild.genApis()
//  .then(r => {
//   console.log(apiBuild.apis)
//  })