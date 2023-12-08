"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genApisFile = exports.ApiBuild = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function isArrayEmpty(arr) {
    return !(Array.isArray(arr) && arr.length > 0);
}
class ApiBuild {
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
            this.base = path_1.default.parse(apiRoot).base;
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
            const apiPath = path_1.default.resolve(root, dir);
            const files = yield fs_1.default.promises.readdir(apiPath);
            if (isArrayEmpty(files)) {
                return [];
            }
            for (let k = 0; k < files.length; k++) {
                const filepath = path_1.default.resolve(root, dir, files[k]);
                const stat = yield fs_1.default.promises.stat(filepath);
                if (stat.isFile() && this.apiExt.includes(path_1.default.parse(filepath).ext.replace(/^\./, ''))) {
                    const indexData = yield Promise.resolve(`${'file://' + filepath}`).then(s => __importStar(require(s)));
                    const indexDataDefault = indexData.default;
                    if (Array.isArray(indexDataDefault)) {
                        indexDataDefault.forEach(handler => {
                            this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: 'array', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path_1.default.parse(files[k]).name, method: handler.method || "get", handler: handler.handler || function (ctx) { } }, handler));
                        });
                    }
                    else if (typeof indexDataDefault === 'object') {
                        this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: 'object', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path_1.default.parse(files[k]).name, method: indexDataDefault.method || "get", handler: indexDataDefault.handler || function (ctx) { } }, indexDataDefault));
                    }
                    else if (typeof indexDataDefault === 'function') {
                        this.apis.push({
                            import: (dir ? (dir + '/') : '') + files[k],
                            importType: 'function',
                            path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path_1.default.parse(files[k]).name,
                            method: "get",
                            handler: indexDataDefault || function (ctx) { },
                        });
                    }
                    else if (!indexDataDefault && indexData.handler) {
                        this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: '*', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path_1.default.parse(files[k]).name, method: indexData.method || "get", handler: indexData.handler || function (ctx) { } }, indexData));
                    }
                }
                else if (stat.isDirectory()) {
                    yield this.readApis(dir ? (dir + '/' + files[k]) : files[k]);
                }
            }
        });
    }
}
exports.ApiBuild = ApiBuild;
function genApisFile() {
    const cmdLine = process.argv.join(" ");
    const apiPath = cmdLine.match(/--path\s(\w+)/) ? cmdLine.match(/--path\s(\S+)/)[1] : "api";
    const base = cmdLine.match(/--base\s(\w+)/) ? cmdLine.match(/--base\s(\S+)/)[1] : "";
    const watch = cmdLine.match(/--watch\s(\w+)/) ? cmdLine.match(/--watch\s(\S+)/)[1] : "";
    const out = cmdLine.match(/--out\s(\w+)/) ? cmdLine.match(/--out\s(\S+)/)[1] : (path_1.default.parse(apiPath).dir ? (path_1.default.parse(apiPath).dir + '/' + "out.js") : "out.js");
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
        const root = path_1.default.resolve(process.cwd(), apisPath);
        const watchRoot = path_1.default.resolve(process.cwd(), argv.watch || apisPath);
        const fileType = argv.out.match(/\.(\w+)$/)[1];
        startGen();
        if (argv.isWatch) {
            console.log(`开始监听${watchRoot}`);
            fs_1.default.watch(watchRoot, {
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
                    const dir = apisPath.replace(new RegExp(`^${path_1.default.parse(argv.out).dir}`), "");
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
                    yield fs_1.default.promises.writeFile(path_1.default.resolve(process.cwd(), argv.out), fileString);
                    console.log('生成成功');
                }
                catch (err) {
                    console.error(err);
                }
            }));
        }
    }
}
exports.genApisFile = genApisFile;
