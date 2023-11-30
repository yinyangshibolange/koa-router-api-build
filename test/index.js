import {ApiBuild} from "../dist/module/index.js"
import path from "path"
const ab = new ApiBuild(path.resolve(process.cwd(), "api"))

ab.genApis(r => {
 console.log(ab.apis)
})