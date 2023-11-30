#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const index_js_1 = require("../index.js");
const path_1 = __importDefault(require("path"));
(0, yargs_1.default)().command({
    command: 'init',
    describe: 'init your user space',
    builder: {
        path: {
            alias: 'p',
            describe: 'init file paths',
            demand: false,
            type: 'string'
        },
        base: {
            alias: 'b',
            describe: 'api base',
            demand: false,
            type: 'string'
        }
    },
    handler(argv) {
        const root = path_1.default.resolve(process.cwd(), argv.path);
        const apiBuild = new index_js_1.ApiBuild(root, argv.base);
        apiBuild.genApis()
            .then(r => {
            console.log(apiBuild.apis);
        });
    }
})
    // .command({
    //   command: 'start',
    //   describe: 'start your md service',
    //   builder: {
    //     path: {
    //       alias: 'p',
    //       describe: 'init file paths',
    //       demand: false,
    //       type: 'string'
    //     }
    //   },
    //   handler (argv) {
    //     startServe(argv.path)
    //   }
    // })
    .example('$0 init -p C://user/Document', 'init at path C://user/Document')
    .example('$0 init', 'init at current path')
    .example('$0 start -c md.config.js', 'start md service use md.config.js')
    .example('$0 start', 'start md service use default config (ssr-md.config.js)')
    .wrap(null)
    .argv;
