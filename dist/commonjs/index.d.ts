import * as KoaJoiRouter from "koa-joi-router";
declare module "koa-joi-router" { }
interface Api extends KoaJoiRouter.Spec {
    import: string;
    importType: string;
    meta?: any;
    whites?: string | string[];
    [key: string]: any;
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
export declare function genApisFile(): void;
export {};
