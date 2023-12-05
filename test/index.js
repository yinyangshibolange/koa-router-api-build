import {ApiBuild} from "../index.ts"
import path from "path"
const ab = new ApiBuild(path.resolve(process.cwd(), "api"))

ab.genApis()
 .then(apis => {
  console.log(apis)
 })