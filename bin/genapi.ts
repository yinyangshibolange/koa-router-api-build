import path from "path";
import fs from "fs";

const cmdLine = process.argv.join(" ");
const apiPath = cmdLine.match(/--path\s(\w+)/)
  ? cmdLine.match(/--path\s(\S+)/)[1]
  : "api";

const name = cmdLine.match(/--name\s(\w+)/)
  ? cmdLine.match(/--name\s(\S+)/)[1]
  : "demo";

const root = path.resolve(process.cwd(), apiPath);

const dirPath = path.resolve(root, name);

const fileStrs = [{
 fileName: 'add.ts',
 fileStr: `
 import { PrismaClient } from '@prisma/client';
import { Codes, Messages } from '../../config/codes.js';
import Joi from 'joi'
import { ${name} } from '../../schema/${name}.js';

const prisma = new PrismaClient();

export const meta = {
  swagger: {
    summary: '添加',
    description: \`添加\`,
    tags: ['${name}']
  }
}



export const validate = {
  body: ${name},
  type: 'json', // form, json, multipart
  output: {
    200: {
      body: {
        code: Joi.number(),
        data: {
          ${name}Id: Joi.number()
        },
        message: Joi.string()
      }
    }
  }
}
export const method: string = 'post'
export  async function handler(ctx) {
  try {
    const ${name} = await prisma.${name}.create({
      data: ctx.request.body,
    });
  
    ctx.body = {
      code: Codes.SUCCESS,
      data: {
        ${name}Id: ${name}.id
      },
      message: Messages.SUCCESS
    }
  }catch(err) {
    ctx.body = {
      code: Codes.OTHER_ERROR,
      data: {
        ${name}Id: -1
      },
      message: err.message
    }
  }
  
}  

 `
}, {
 fileName: 'delete.ts',
 fileStr: `
 import { PrismaClient } from '@prisma/client';
import { Codes, Messages } from '../../config/codes.js';
import Joi from 'joi'

const prisma = new PrismaClient();

export const meta = {
 swagger: {
  summary: '删除',
  description: '删除，传id',
  tags: ['${name}']
 }
}

export const validate = {
 query: {
  id: Joi.number().required().label("id")
 },
 output: {
  200: {
   body: {
    code: Joi.number(),
    data: Joi.any(),
    message: Joi.string()
   }
  }
 }
}
export const method: string = 'delete'
export async function handler(ctx) {
 try {
  const { id } = ctx.request.query
  const ${name} = await prisma.${name}.delete({
   where: {
    id
   }
  });

  ctx.body = {
   code: Codes.SUCCESS,
   data: {
    ${name}Id: ${name}.id
   },
   message: Messages.SUCCESS
  }
 } catch (err) {
  ctx.body = {
   code: Codes.OTHER_ERROR,
   message: err.message
  }
 }

}  

 `
}, {
 fileName: 'get.ts',
 fileStr: `
 import { PrismaClient } from '@prisma/client';
import { Codes, Messages } from '../../config/codes.js';
import { ${name} } from '../../schema/${name}.js';

import Joi from 'joi'

const prisma = new PrismaClient();

export const meta = {
  swagger: {
    summary: '查询列表',
    description: '查询列表',
    tags: ['${name}']
  }
}

export const validate = {
  query: {},
  output: {
    200: {
      body: {
        code: Joi.number(),
        data: Joi.array().items(${name}),
        message: Joi.string()
      }
    }
  }
}
export async function handler(ctx) {
  try {
    const ${name}s = await prisma.${name}.findMany();

    ctx.body = {
      code: Codes.SUCCESS,
      data: ${name}s,
      message: Messages.SUCCESS
    }
  } catch (err) {
    ctx.body = {
      code: Codes.OTHER_ERROR,
      data: [],
      message: err.message
    }
  }
}
 `
}, {
 fileName: 'page.ts',
 fileStr: `
 import { PrismaClient } from '@prisma/client';
import { Codes, Messages } from '../../config/codes.js';
import { ${name} } from '../../schema/${name}.js';

import Joi from 'joi'
import { Context } from 'koa';

const prisma = new PrismaClient();

export const meta = {
 swagger: {
  summary: '查询列表(分页)',
  description: '查询列表(分页)',
  tags: ['${name}']
 }
}

export const validate = {
 query: {},
 output: {
  200: {
   body: {
    code: Joi.number(),
    data: {
     page: Joi.number(),
     total: Joi.number(),
     list: Joi.array().items(${name})
    },
    message: Joi.string()
   }
  }
 }
}
export async function handler(ctx: Context) {
 const { page = 1, pagesize = 10 } = ctx.request.query
 try {
  const ${name}s = await prisma.${name}.findMany({
   skip: (+page - 1) * +pagesize,
   take: +pagesize,
  });

  const total = await prisma.${name}.count()

  ctx.body = {
   code: Codes.SUCCESS,
   data: {
    page,
    list: ${name}s,
    total,
   },
   message: Messages.SUCCESS
  }
 } catch (err) {
  ctx.body = {
   code: Codes.OTHER_ERROR,
   data: {
    page: +page,
    total: 0,
    list: [],
   },
   message: err.message
  }
 }
}
 `
}, {
 fileName: 'put.ts',
 fileStr: `
 import { PrismaClient } from '@prisma/client';
import { Codes, Messages } from '../../config/codes.js';
import Joi from 'joi'
import { ${name} } from '../../schema/${name}.js';

const prisma = new PrismaClient();

export const meta = {
 swagger: {
  summary: '修改',
  description: '修改',
  tags: ['${name}']
 }
}

export const validate = {
 body: ${name},
 type: 'json', // form, json, multipart
 output: {
  200: {
   body: {
    code: Joi.number(),
    data: {
     ${name}Id: Joi.number()
    },
    message: Joi.string()
   }
  }
 }
}
export const method: string = 'put'
export async function handler(ctx) {
 try {
  const { id} = ctx.request.body
  const ${name} = await prisma.${name}.update({
   data: ctx.request.body,
   where: {
    id: id
   }
  });

  ctx.body = {
   code: Codes.SUCCESS,
   data: {
    ${name}Id: ${name}.id
   },
   message: Messages.SUCCESS
  }
 } catch (err) {
  ctx.body = {
   code: Codes.OTHER_ERROR,
   data: {
    ${name}Id: -1
   },
   message: err.message
  }
 }

}  

 `
}, ]
async function buildModule(dirPath, fileStrs) {
 let stat
try {
  stat = await fs.promises.stat(dirPath)
} catch(err) {
 console.log(err)
}
 if(!stat || !stat.isDirectory()) {
  await fs.promises.mkdir(dirPath)
 }
 for(let item of fileStrs) {
  const {fileName,fileStr} = item
  fs.promises.writeFile(path.resolve(dirPath, fileName), fileStr)
 }
}

buildModule(dirPath, fileStrs)