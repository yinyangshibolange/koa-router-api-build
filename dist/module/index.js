var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "fs";
import path from "path";
function isArrayEmpty(arr) {
    return !(Array.isArray(arr) && arr.length > 0);
}
export class ApiBuild {
    constructor(apiRoot, base, apiExt) {
        this.apiRoot = '';
        this.base = '';
        this.apiExt = ['ts', 'js'];
        this.apis = [];
        this.apiRoot = apiRoot;
        if (typeof base === 'string') {
            this.base = base;
        }
        else {
            this.base = path.parse(apiRoot).base;
        }
        if (typeof apiExt === 'string') {
            this.apiExt = [apiExt];
        }
        else if (Array.isArray(apiExt)) {
            this.apiExt = apiExt;
        }
    }
    genApis() {
        return __awaiter(this, void 0, void 0, function* () {
            this.apis = [];
            yield this.readApis();
            return this.apis;
        });
    }
    readApis(dir = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const root = this.apiRoot;
            const apiPath = path.resolve(root, dir);
            const files = yield fs.promises.readdir(apiPath);
            if (isArrayEmpty(files)) {
                return [];
            }
            for (let k = 0; k < files.length; k++) {
                const filepath = path.resolve(root, dir, files[k]);
                const stat = yield fs.promises.stat(filepath);
                if (stat.isFile() && this.apiExt.includes(path.parse(filepath).ext.replace(/^\./, ''))) {
                    const indexData = yield import('file://' + filepath);
                    const indexDataDefault = indexData.default;
                    if (Array.isArray(indexDataDefault)) {
                        indexDataDefault.forEach(handler => {
                            this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: 'array', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name, method: handler.method || "get", handler: handler.handler || function (ctx) { } }, handler));
                        });
                    }
                    else if (typeof indexDataDefault === 'object') {
                        this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: 'object', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name, method: indexDataDefault.method || "get", handler: indexDataDefault.handler || function (ctx) { } }, indexDataDefault));
                    }
                    else if (typeof indexDataDefault === 'function') {
                        this.apis.push({
                            import: (dir ? (dir + '/') : '') + files[k],
                            importType: 'function',
                            path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name,
                            method: "get",
                            handler: indexDataDefault || function (ctx) { },
                        });
                    }
                    else if (!indexDataDefault && indexData.handler) {
                        this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: '*', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name, method: indexData.method || "get", handler: indexData.handler || function (ctx) { } }, indexData));
                    }
                }
                else if (stat.isDirectory()) {
                    yield this.readApis(dir ? (dir + '/' + files[k]) : files[k]);
                }
            }
        });
    }
}
export function genApisFile() {
    const cmdLine = process.argv.join(" ");
    const apiPath = cmdLine.match(/--path\s(\w+)/) ? cmdLine.match(/--path\s(\S+)/)[1] : "api";
    const base = cmdLine.match(/--base\s(\w+)/) ? cmdLine.match(/--base\s(\S+)/)[1] : "";
    const watch = cmdLine.match(/--watch\s(\w+)/) ? cmdLine.match(/--watch\s(\S+)/)[1] : "";
    const out = cmdLine.match(/--out\s(\w+)/) ? cmdLine.match(/--out\s(\S+)/)[1] : (path.parse(apiPath).dir ? (path.parse(apiPath).dir + '/' + "out.js") : "out.js");
    const isWatch = cmdLine.indexOf("--watch") > -1;
    const argvs = {
        path: apiPath,
        base,
        watch,
        out,
        isWatch
    };
    run(argvs);
    function run(argv) {
        const apisPath = argv.path || "api";
        const root = path.resolve(process.cwd(), apisPath);
        const watchRoot = path.resolve(process.cwd(), argv.watch || apisPath);
        const fileType = argv.out.match(/\.(\w+)$/)[1];
        startGen();
        if (argv.isWatch) {
            console.log(`开始监听${watchRoot}`);
            fs.watch(watchRoot, {
                persistent: true,
                recursive: true,
            }, (evt, filename) => {
                console.log(evt, filename);
                startGen();
            });
        }
        function startGen() {
            const apiBuild = new ApiBuild(root, argv.base);
            apiBuild.genApis()
                .then((apis) => __awaiter(this, void 0, void 0, function* () {
                let fileString = `import Router from "koa-joi-router"\n`;
                apis.forEach(api => {
                    const moduleName = api.path.replace(/\.\w+$/, '').replace(/\//g, '_');
                    const dir = apisPath.replace(new RegExp(`^${path.parse(argv.out).dir}`), "");
                    if (api.importType === 'object') {
                        fileString += `import ${moduleName} from ".${dir ? `/${dir}` : ''}/${api.import.replace(/\.ts$/, '.js')}"\n`;
                    }
                    else if (api.importType === '*') {
                        fileString += `import * as ${moduleName} from ".${dir ? `/${dir}` : ''}/${api.import.replace(/\.ts$/, '.js')}"\n`;
                    }
                    else if (api.importType === 'array') {
                        fileString += `import ${moduleName} from ".${dir ? `/${dir}` : ''}/${api.import.replace(/\.ts$/, '.js')}"\n`;
                    }
                    else if (api.importType === 'function') {
                        fileString += `import ${moduleName} from ".${dir ? `/${dir}` : ''}/${api.import.replace(/\.ts$/, '.js')}"\n`;
                    }
                });
                fileString += '\n\n';
                fileString += `
         const files = [${apis.map(api => {
                    return `{
            path: "${api.path.replace(/\.\w+$/, '')}",
            module:  ${api.path.replace(/\.\w+$/, '').replace(/\//g, '_')}
          }`;
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
       files.forEach((item${fileType === 'ts' ? ': any' : ''}) => {
         if(Array.isArray(item.module)) {
           item.module.forEach(item1 => {
             if ((Array.isArray(item1.whites) && item1.whites.includes("auth")) || (typeof item1.whites === 'string' && item1.whites=== 'auth')) {
               authWhiteList.push(item.path)
              }
             routers.push(genRouter({
              ...item1,
              path: item.path
             }))
           })
         } else if(typeof item.module === 'function'){
           routers.push(genRouter({
            path: item.path,
             handler: item
           }))
         } else  {
           if ((Array.isArray(item.module.whites) && item.module.whites.includes("auth")) || (typeof item.module.whites === 'string' && item.module.whites=== 'auth')) {
             authWhiteList.push(item.path)
            }
           routers.push(genRouter({
            ...item.module,
            path: item.path
           }))
         }
 
    
   })
         `;
                try {
                    yield fs.promises.writeFile(path.resolve(process.cwd(), argv.out), fileString);
                    console.log('生成成功');
                }
                catch (err) {
                    console.error(err);
                }
            }));
        }
    }
}
