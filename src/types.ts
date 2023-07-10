import { JSONSchema } from 'json-schema-to-typescript'

export const TIRE_ROOT = 'TireRoot'
export const ROW_DATA_FILE_NAME = 'raw_data.json'
export const UPDATE_LIST_FILE_NAME = '.o2t'

export const TOP_LEVEL_NAMESPACE = ['Get', 'Post', 'Put', 'Delete']

export type APIStatus = 'developing' | 'testing' | 'released' | 'deprecated'

export enum Methods {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
}

export enum NodeType {
    ROOT,
    NAMESPACE,
    PARENT_NODE,
    CHILD_NODE,
}

export interface ApiFoxSchema extends JSONSchema {
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
    schema: ApiFoxSchema
}

export interface RequestBody {
    content: {
        [key: string]: {
            schema: ApiFoxSchema
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
                schema: ApiFoxSchema
            }
        }
    }
}

export type Properties = { [k: string]: JSONSchema }

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
                ['x-apifox-status']: APIStatus
            }
        }
    },
    components: {
        schemas: {
            [key: string]: ApiFoxSchema
        }
    }
}

export interface TireSeed {
    path: string;
    originalPath: string;
    content: TireSeedContent;
}

export interface TireSeedContent {
    method: Methods
    body?: JSONSchema
    params?: JSONSchema
    response?: JSONSchema
}
