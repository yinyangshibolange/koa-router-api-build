import fs from "fs"
import path from "path"
import { type RouterContext } from "koa-router"
import * as KoaJoiRouter from "koa-joi-router";

declare module "koa-joi-router" {}

function isArrayEmpty(arr) {
 return !(Array.isArray(arr) && arr.length > 0)
}
interface Api extends KoaJoiRouter.Spec {
 import: string;
 importType: string;
 meta?: any;
 whites?: string | string[];
 [key: string]: any;
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
  return this.apis
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
       path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name,
       method: handler.method || "get",
       handler: handler.handler || function (ctx: RouterContext) { },
       ...handler,
      })
     })
    } else if (typeof indexDataDefault === 'object') {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: 'object',
      path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name,
      method: indexDataDefault.method || "get",
      handler: indexDataDefault.handler || function (ctx: RouterContext) { },
      ...indexDataDefault,
     })
    }  else if (typeof indexDataDefault === 'function') {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: 'function',
      path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name,
      method: "get",
      handler: indexDataDefault || function (ctx: RouterContext) { },

     })
    } else if(!indexDataDefault && indexData.handler) {
     this.apis.push({
      import: (dir ? (dir + '/') : '') + files[k],
      importType: '*',
      path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name,
      method: indexData.method || "get",
      handler: indexData.handler || function (ctx: RouterContext) { },
      ...indexData,
     })
    }
   } else if (stat.isDirectory()) {
    await this.readApis(dir ? (dir + '/' + files[k]) : files[k])
   }
  }
 }
}



export function genApisFile() {
 const cmdLine = process.argv.join(" ")
 const apiPath = cmdLine.match(/--path\s(\w+)/) ?  cmdLine.match(/--path\s(\S+)/)[1] : "api"
 const base = cmdLine.match(/--base\s(\w+)/) ? cmdLine.match(/--base\s(\S+)/)[1] : ""
 const watch = cmdLine.match(/--watch\s(\w+)/) ? cmdLine.match(/--watch\s(\S+)/)[1] : ""
 const out = cmdLine.match(/--out\s(\w+)/) ? cmdLine.match(/--out\s(\S+)/)[1] :(path.parse(apiPath).dir ? (path.parse(apiPath).dir + '/' + "out.js") : "out.js")
 const isWatch = cmdLine.indexOf("--watch") > -1

 const argvs = {
   path: apiPath,
   base,
   watch,
   out,
   isWatch
 }
 
 run(argvs)
 
 function run(argv) {
   const apisPath = argv.path || "api"
   const root = path.resolve(process.cwd(), apisPath)
   const watchRoot = path.resolve(process.cwd(),    argv.watch || apisPath)
   const fileType = argv.out.match(/\.(\w+)$/)[1]
 
   startGen()
 
   if(argv.isWatch) {
    console.log(`开始监听${watchRoot}`)
     fs.watch(watchRoot, {
       persistent : true,
       recursive: true,
     }, (evt, filename) => {
         console.log(evt, filename)
         startGen()
     })
   }
 
   function startGen() {
     const apiBuild = new ApiBuild(root)
     apiBuild.genApis()
     .then(async apis => {
       let fileString = `import Router from "koa-joi-router"\n`
       apis.forEach(api => {
         const moduleName = (api.path as string).replace(/\.\w+$/, '').replace(/\//g, '_')
         const dir = apisPath.replace(new RegExp(`^${path.parse(argv.out).dir}`), "")
         if (api.importType === 'object') {
           fileString += `import ${moduleName} from ".${dir}/${api.import.replace(/\.ts$/, '.js')}"\n`
         } else if (api.importType === '*') {
           fileString += `import * as ${moduleName} from ".${dir}/${api.import.replace(/\.ts$/, '.js')}"\n`
         } else if (api.importType === 'array') {
           fileString += `import ${moduleName} from ".${dir}/${api.import.replace(/\.ts$/, '.js')}"\n`
         } else if (api.importType === 'function') {
           fileString += `import ${moduleName} from ".${dir}/${api.import.replace(/\.ts$/, '.js')}"\n`
         }
       })
 
       fileString += '\n\n'
       fileString += `
         const files = [${apis.map(api => {
          return `{
            path: "${(api.path as string).replace(/\.\w+$/, '')}",
            module:  ${(api.path as string).replace(/\.\w+$/, '').replace(/\//g, '_')}
          }`
         }).join(",")}]
       export  let routers = []
       export let authWhiteList = []
       function genRouter(item) {
         const router = Router()
         router.route({
          meta: item.meta,
          method: item.method,
          path: item.path,
          validate: {
           ...item.validate,
           validateOptions: {
            messages: {
             'string.alphanum': '{#label} 只能包含字母和数字',
             'string.min': '{#label} 长度不能小于 {#limit} 个字符',
             'string.max': '{#label} 长度不能大于 {#limit} 个字符',
             'string.pattern.base': '{#label} 只能包含字母和数字',
             'any.required': '{#label} 是必填项',
             'string.email': '{#label} 不是一个有效的邮箱地址',
             'any.only': '{#label} 与 {#ref} 不一致',
             ...item.validate?.validateOptions?.messages
            },
           }
          },
          handler: item.handler
         });
         return router
       }
       files.forEach((item${fileType==='ts'?': any': ''}) => {
         if(Array.isArray(item.module)) {
           item.module.forEach(item1 => {
             if ((Array.isArray(item1.whites) && item1.whites.includes("auth")) || (typeof item1.whites === 'string' && item1.whites=== 'auth')) {
               authWhiteList.push(item.path)
              }
             routers.push(genRouter({
              path: item.path,
              method: 'get',
              ...item1,
             }))
           })
         } else if(typeof item.module === 'function'){
           routers.push(genRouter({
            path: item.path,
             handler: item.module,
             method: 'get'
           }))
         } else  {
           if ((Array.isArray(item.module.whites) && item.module.whites.includes("auth")) || (typeof item.module.whites === 'string' && item.module.whites=== 'auth')) {
             authWhiteList.push(item.path)
            }
           routers.push(genRouter({
            path: item.path,
            method: 'get',
            ...item.module,
           }))
         }
 
    
   })
         `
       try {
         await fs.promises.writeFile(path.resolve(process.cwd(), argv.out), fileString)
         console.log('生成成功')
       } catch (err) {
         console.error(err)
       }
     })
   }
   
 }
 
}