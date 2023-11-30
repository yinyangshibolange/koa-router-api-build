# 适用于koa-router

## 用于动态生成router路由


## 使用demo如下

在api文件夹所在同级目录新建genkey.js文件，内容如下：

```javascript
// genkey.js
import {ApiBuild} from "koa-router-api-build"
import path from "path"

async function genRouters () {
 const root = path.resolve(__dirname, "./api")
 const ab = new ApiBuild(root)
 await ab.genApis()
 console.log(ab.apis)
 return ab.apis
}

```
