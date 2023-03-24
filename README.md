# O2T
Apifox CLI (OpenApi schema to TypeScript)

根据 [Apifox](https://www.apifox.cn/) 导出的 [OpenApi](https://en.wikipedia.org/wiki/OpenAPI_Specification) 文档数据生成由 [Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html) 组织层级的 TypeScript 接口数据类型定义文件并自动发布到你的 NPM。


## 用法

### [配置](config.ts)

> ts 文件生成后自动上传 NPM 的所需配置信息

> **建议注册一个账号给机器人使用**

- **REGISTRY**: NPM 地址
- **USERNAME**: NPM 登录用户名
- **PASSWORD**: NPM 登录密码
- **EMAIL**:    NPM 注册邮箱
- **AUTHOR**:   自动生成文件的作者（可选）

### 编译
```shell
$ npm run build
```

### 发布 O2T CLI
```shell
$ npm publish .
```

### 安装 O2T CLI

```shell
$ npm i o2t -g
```

### 使用
```shell
$ o2t --url <OPEN_API_DATA_URL> --name <GENERATED_FILE_NAME>

# -u,  --url        URL of OpenApi
# -n,  --name       Name for Generated file
```
> URL 在【接口管理】-【项目概览】-【代码生成】-【立即生成】中可以获取

执行 CLI 后会得到 `npm i @types/<GENERATED_FILE_NAME>@1.0.0-<TIMESTAMP> -D` 提示，在项目中安装即可。


Apifox 暂时不支持提供公开 API，目前只提供本地启动 Apifox ，然后使用它创建的本地服务器接口获取数据，所以暂时无法通过将程序部署到云端，待公开 API 开放就可以整合到[钉钉机器人](https://github.com/ShiverZheng/Y2T-Robot)中。


## 实现

具体实现和底层算法与 Y2T 相似，使用 Tire 实现，可以参考 Y2T 的 [README.md](https://github.com/ShiverZheng/Y2T#y2t)。

Apifox 提供的数据定义大致如下：
```typescript
export interface ApifoxSchema extends JSONSchema {
    'x-apifox'?: unknown
    'x-apifox-orders'?: string[]
    'x-apifox-ignore-properties'?: string[]
}

export interface Parameter {
    name: string
    in: 'query' | 'header'
    description: string
    required: boolean
    example: string
    schema: ApifoxSchema
}

export interface RequestBody {
    content: {
        [key: string]: {
            schema: ApifoxSchema
        }
    }
}

export interface Responses {
    // Http status: 200...
    [key: string]: {
        description: string
        content: {
            // Content Type: application/json...
            [key: string]: {
                schema: ApifoxSchema
            }
        }
    }
}

export interface ApiFoxData {
    openapi: string
    info: {
        title: string
        description: string
        version: string
    }
    tag: { name: string }[],
    paths: {
        [key: string]: {
            [key in Methods]: {
                summary: string
                deprecated: boolean
                description: string
                tags: string[]
                parameters: Parameter[]
                requestBody: RequestBody
                responses: Responses
            }
        }
    }
}
```

对数据进行一定的预处理后，转换成 `TireSeed` 需要的数据格式，然后使用 [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript#readme) 将模型转换成 ts 接口。

与 YApi 不同的是 Apifox 提供的数据是基于 OpenApi 的标准，然后添加了一些自定义的字段产生的，所以剔除这些自定义字段之后就能得到 OpenApi 的数据，所以 O2T 理论上兼容所有符合 OpenApi 标准的数据转换，同时得益于 OpenApi 底层使用 JSONSchema ，所以 O2T 可以支持枚举类型的生成了。
