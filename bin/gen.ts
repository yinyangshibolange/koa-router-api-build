#!/usr/bin/env node

import  { ApiBuild } from "../index.js"
import path from "path"
import fs from "fs"

const cmdLine = process.argv.join(" ")
const apiPath = cmdLine.match(/--path\s(\w+)/) ?  cmdLine.match(/--path\s(\S+)/)[1] : ""
const base = cmdLine.match(/--base\s(\w+)/) ? cmdLine.match(/--base\s(\S+)/)[1] : ""
const watch = cmdLine.match(/--watch\s(\w+)/) ? cmdLine.match(/--watch\s(\S+)/)[1] : ""
const out = cmdLine.match(/--out\s(\w+)/) ? cmdLine.match(/--out\s(\S+)/)[1] : "out.js"
const isWatch = cmdLine.indexOf("--watch") > -1

console.log(`exmaple:gen --path src/api --base api --out out.ts --watch`)
// console.log((program as any).path)
const argvs = {
  path: apiPath || "api",
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
    fs.watch(watchRoot, {
      persistent : true,
      recursive: true,
    }, (evt, filename) => {
        console.log(evt, filename)
        startGen()
    })
  }

  function startGen() {
    const apiBuild = new ApiBuild(root, argv.base)
    apiBuild.genApis()
    .then(async apis => {
      let fileString = `import Router from "koa-joi-router"\n`
      apis.forEach(api => {
        const moduleName = (api.path as string).replace(/\.\w+$/, '').replace(/\//g, '_')
        if (api.importType === 'object') {
          fileString += `import ${moduleName} from "./${apisPath}/${api.import.replace(/\.ts$/, '.js')}"\n`
        } else if (api.importType === '*') {
          fileString += `import * as ${moduleName} from "./${apisPath}/${api.import.replace(/\.ts$/, '.js')}"\n`
        } else if (api.importType === 'array') {
          fileString += `import ${moduleName} from "./${apisPath}/${api.import.replace(/\.ts$/, '.js')}"\n`
        } else if (api.importType === 'function') {
          fileString += `import ${moduleName} from "./${apisPath}/${api.import.replace(/\.ts$/, '.js')}"\n`
        }
      })

      fileString += '\n\n'
      fileString += `
        const files = [${apis.map(api => (api.path as string).replace(/\.\w+$/, '').replace(/\//g, '_')).join(",")}]
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
        if(Array.isArray(item)) {
          item.forEach(item => {
            if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
              authWhiteList.push(item.path)
             }
            routers.push(genRouter(item))
          })
        } else if(typeof item === 'function'){
          routers.push(genRouter({
            handler: item
          }))
        } else  {
          if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
            authWhiteList.push(item.path)
           }
          routers.push(genRouter(item))
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
