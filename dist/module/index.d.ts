import { type RouterContext } from "koa-router";
interface Api {
    index: string;
    method: string;
    handler: (ctx: RouterContext) => {};
}
export declare class ApiBuild {
    apiRoot: string;
    base: string;
    apis: Api[];
    constructor(apiRoot: string, base?: string);
    genApis(): Promise<void>;
    readApis(dir?: string): Promise<any[]>;
}
export {};
