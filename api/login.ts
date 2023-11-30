import { type RouterContext } from "koa-router"

export default async function (ctx: RouterContext)  {
    console.log(ctx.state)

}


