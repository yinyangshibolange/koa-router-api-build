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
    constructor(apiRoot, base) {
        this.apiRoot = '';
        this.base = '';
        this.apis = [];
        this.apiRoot = apiRoot;
        if (typeof base === 'string') {
            this.base = base;
        }
        else {
            this.base = path.parse(apiRoot).base;
        }
    }
    genApis() {
        return __awaiter(this, void 0, void 0, function* () {
            this.apis = [];
            yield this.readApis();
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
                if (stat.isFile()) {
                    const handler = yield import('file://' + filepath);
                    this.apis.push({
                        index: (this.base ? ('/' + this.base) : '') + `/` + (dir ? (dir + '/') : '') + files[k],
                        method: handler.method,
                        handler: handler.handler
                    });
                }
                else if (stat.isDirectory()) {
                    yield this.readApis(dir ? (dir + '/' + files[k]) : files[k]);
                }
            }
        });
    }
}
// const apiBuild = new ApiBuild(path.resolve(process.cwd(), "../src/api"))
// apiBuild.genApis()
//  .then(r => {
//   console.log(apiBuild.apis)
//  })
