#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Command } from "commander";
import { ApiBuild } from "../index.js";
import path from "path";
import fs from "fs";
const program = new Command();
program
    .name("gen koa-router")
    .version("1.0.0")
    .option('-c, --config <path>', 'set config path', './deploy.conf');
program.command('gen')
    .alias("g")
    .description("自动生成API导入文件")
    .option('-p, --path <path>', 'init file paths', 'src/api')
    .option('-b, --base <base>', 'api base prefix', 'api')
    .option('-w, --watch <dir>', 'watch dir files change', 'src/api')
    .action((env, argv) => {
    console.log(env, argv);
    const apisPath = argv.path || "api";
    const root = path.resolve(process.cwd(), apisPath);
    const apiBuild = new ApiBuild(root, argv.base);
    apiBuild.genApis()
        .then((apis) => __awaiter(void 0, void 0, void 0, function* () {
        let fileString = `import Router from "koa-joi-router"\n`;
        apis.forEach(api => {
            if (api.importType === 'object') {
                fileString += `import ${path.parse(api.path.replace(/\//g, '_'))} from ${api.import}\n`;
            }
            else if (api.importType === '*') {
                fileString += `import * as ${path.parse(api.path.replace(/\//g, '_'))} from ${api.import}\n`;
            }
            else if (api.importType === 'array') {
                fileString += `import ${path.parse(api.path.replace(/\//g, '_'))} from ${api.import}\n`;
            }
            else if (api.importType === 'function') {
                fileString += `import ${path.parse(api.path.replace(/\//g, '_'))} from ${api.import}\n`;
            }
        });
        fileString += '\n\n';
        fileString += `
        const files = [${apis.map(api => path.parse(api.path.replace(/\//g, '_'))).join(",")}]
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
      files.forEach(item => {
        if(Array.isArray(item)) {
          item.forEach(item => {
            if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
              authWhiteList.push(item.path)
             }
            routers.push(genRouter(item1))
          })
        } else  {
          if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
            authWhiteList.push(item.path)
           }
          routers.push(genRouter(item))
        }

   
  })
        `;
        console.log(fileString);
        try {
            yield fs.promises.writeFile(path.resolve(process.cwd(), 'genedRouters.ts'), fileString);
        }
        catch (err) {
            console.error(err);
        }
    }));
});
