import type { Spec } from "koa-joi-router";
interface Api extends Spec {
    import: string;
    importType: string;
    meta?: any;
}
export declare class ApiBuild {
    apiRoot: string;
    base: string;
    apiExt: string[];
    apis: Api[];
    constructor(apiRoot: string, base?: string, apiExt?: string[] | string);
    genApis(): Promise<Api[]>;
    readApis(dir?: string): Promise<any[]>;
}
export {};
