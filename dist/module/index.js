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
                        this.apis.push(Object.assign({ import: (dir ? (dir + '/') : '') + files[k], importType: '{method, handler}', path: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + path.parse(files[k]).name, method: indexData.method || "get", handler: indexData.handler || function (ctx) { } }, indexData));
                    }
                }
                else if (stat.isDirectory()) {
                    yield this.readApis(dir ? (dir + '/' + files[k]) : files[k]);
                }
            }
        });
    }
}
