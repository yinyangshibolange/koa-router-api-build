import Router from "koa-joi-router"
import _admin_category_add from "./api/admin/category/add.js"
import _admin_category_get from "./api/admin/category/get.js"
import _admin_file_upload from "./api/admin/file/upload.js"
import _admin_mds_add from "./api/admin/mds/add.js"
import _admin_mds_get from "./api/admin/mds/get.js"
import _login from "./api/login.js"
import _register from "./api/register.js"



         const files = [_admin_category_add,_admin_category_get,_admin_file_upload,_admin_mds_add,_admin_mds_get,_login,_register]
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
       files.forEach((item: any) => {
         if(Array.isArray(item)) {
           item.forEach(item => {
             if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
               authWhiteList.push(item.path)
              }
             routers.push(genRouter(item))
           })
         } else if(typeof item === 'function'){
           routers.push(genRouter({
             handler: item
           }))
         } else  {
           if ((Array.isArray(item.whites) && item.whites.includes("auth")) || (typeof item.whites === 'string' && item.whites=== 'auth')) {
             authWhiteList.push(item.path)
            }
           routers.push(genRouter(item))
         }
 
    
   })
         