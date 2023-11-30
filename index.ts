import fs from "fs"
import path from "path"
import { type RouterContext } from "koa-router"

function isArrayEmpty(arr) {
 return !(Array.isArray(arr) && arr.length > 0)
}

interface Api {
 import: string;
 importType: string;
 index: string;
 method: string;
 handler: (ctx: RouterContext) => {}
}

export class ApiBuild {
 apiRoot = ''
 base = ''
 apiExt: string[] = ['ts','js']
 apis: Api[] = []
 constructor(apiRoot: string, base?: string, apiExt?: string[] | string) {
  this.apiRoot = apiRoot
  if (typeof base === 'string') {
   this.base = base
  } else {
   this.base = path.parse(apiRoot).base
  }

  if(typeof apiExt === 'string') {
   this.apiExt = [apiExt]
  } else if(Array.isArray(apiExt)) {
   this.apiExt = apiExt
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
   if (stat.isFile() && this.apiExt.includes(path.parse(filepath).ext.replace(/^\./, ''))) {
    const indexData = await import('file://' + filepath)
    const indexDataDefault = indexData.default
    if (Array.isArray(indexDataDefault)) {
     indexDataDefault.forEach(handler => {
      this.apis.push({
       import: (dir ? (dir + '/') : '') + files[k],
       importType: 'array',
       index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
       method: handler.method || "get",
       handler: handler.handler || function (ctx: RouterContext) { }
      })
     })
    } else if (typeof indexDataDefault === 'object') {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: 'object',
      index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
      method: indexDataDefault.method || "get",
      handler: indexDataDefault.handler || function (ctx: RouterContext) { }
     })
    }  else if (typeof indexDataDefault === 'function') {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: 'function',
      index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
      method: "get",
      handler: indexDataDefault || function (ctx: RouterContext) { }
     })
    } else if(!indexDataDefault && indexData.handler) {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: '{method, handler}',
      index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
      method: indexData.method || "get",
      handler: indexData.handler || function (ctx: RouterContext) { }
     })
    }
   } else if (stat.isDirectory()) {
    await this.readApis(dir ? (dir + '/' + files[k]) : files[k])
   }
  }
 }
}
