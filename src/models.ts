import { JSONSchema } from 'json-schema-to-typescript'

export const TIRE_ROOT = 'TireRoot'

export const TOP_LEVEL_NAMESPACE = ['Get', 'Post', 'Put', 'Delete']

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