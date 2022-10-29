import { JSONSchema } from 'json-schema-to-typescript'

import { deleteUselessProperty } from '../utils'
import { ApiFoxData, ApifoxSchema, Methods, Responses, TireSeed, TireSeedContent } from '../models'

const apifoxDataToTireSeed = (data: ApiFoxData) => {
	const result: TireSeed[] = []

	const jsonContentToSchema = (jsonContent: { schema: JSONSchema }) => {
		const schema: { [key: string]: JSONSchema } = {}
		if (jsonContent.schema && jsonContent.schema.properties) {
			
			for (const property of Object.keys(jsonContent.schema.properties)) {
				const propertyValue = jsonContent.schema.properties[property]
				const value = deleteUselessProperty(propertyValue)

				schema[property] = {
					...value, 
					additionalProperties: false,
				}
			}
		} 
		return schema
	}

	const responsesToSchema = (responses: Responses): JSONSchema => {
		const successResponse = responses['200']
		if (!successResponse) return {}
		const jsonContent = successResponse.content['application/json']
		if (!jsonContent) return {}
		const schema = jsonContentToSchema(jsonContent)
		return {
			title: 'Response',
			additionalProperties: false,
			properties: {
				...schema,
			}
		} 
	}

	for (const url of  Object.keys(data.paths)) {
		const apiData = data.paths[url]
		if (!apiData) continue

		// Format GET Data
		const getInfo = apiData['get']
		if (getInfo)  {
			const content: TireSeedContent = { method: Methods.GET }

			// Request params to schema
			const properties: { [key: string]: ApifoxSchema } = {}
			const { parameters } = getInfo
			if (parameters) {
				for (const parameter of parameters) {
					if (parameter.in === 'query') {
						properties[parameter.name] = {
							additionalProperties: false,
							...deleteUselessProperty(parameter.schema)
						} 
					}
				}
				content.params = {
					properties,
					title: 'Params',
					type: 'object',
					additionalProperties: false,
				}
			}

			// Response data to schema
			const { responses } = getInfo
			if (responses) {
				content.response = responsesToSchema(responses)
			}
            
			const tireSeed = {
				content,
				path: '/Get' + url,
				originalPath: url,
			}

			result.push(tireSeed)
		}
        
		// Format POST Data
		const postInfo = apiData['post']
		if (postInfo) {
			const content: TireSeedContent = { method: Methods.POST }
			const { requestBody } = postInfo

			// Request body to schema
			if (requestBody && requestBody.content) {
				const jsonContent = requestBody.content['application/json']
				if (jsonContent) {
					const schema = jsonContentToSchema(jsonContent)
					content.body = {
						title: 'Body',
						additionalProperties: false,
						required: jsonContent.schema.required,
						properties: {
							...schema,
						}
					} 
				}
			}

			// Response data to schema
			const { responses } = postInfo
			if (responses) {
				content.response = responsesToSchema(responses)
			}

			const tireSeed = {
				content,
				path: '/Post' + url,
				originalPath: url,
			}

			result.push(tireSeed)
		}

		// Format DELETE Data
		const deleteInfo = apiData['delete']
		if (deleteInfo) {
			const content: TireSeedContent = { method: Methods.DELETE }
			// Request params to schema
			const properties: { [key: string]: ApifoxSchema } = {}
			const { parameters } = deleteInfo
			if (parameters) {
				for (const parameter of parameters) {
					if (parameter.in === 'query') {
						properties[parameter.name] = {
							additionalProperties: false,
							...deleteUselessProperty(parameter.schema)
						} 
					}
				}
				content.params = {
					properties,
					title: 'Params',
					type: 'object',
					additionalProperties: false,
				}
			}

			// Response data to schema
			const { responses } = deleteInfo
			if (responses) {
				content.response = responsesToSchema(responses)
			}
            
			const tireSeed = {
				content,
				path: '/Delete' + url,
				originalPath: url,
			}

			result.push(tireSeed)
		}

		// Format PUT Data
		const putInfo = apiData['put']
		if (putInfo) {
			const content: TireSeedContent = { method: Methods.PUT }
			const { requestBody } = putInfo

			// Request body to schema
			if (requestBody && requestBody.content) {
				const jsonContent = requestBody.content['application/json']
				if (jsonContent) {
					const schema = jsonContentToSchema(jsonContent)
					content.body = {
						title: 'Body',
						additionalProperties: false,
						required: jsonContent.schema.required,
						properties: {
							...schema,
						}
					} 
				}
			}

			// Response data to schema
			const { responses } = putInfo
			if (responses) {
				content.response = responsesToSchema(responses)
			}

			const tireSeed = {
				content,
				path: '/Put' + url,
				originalPath: url,
			}

			result.push(tireSeed)
		}

	}
	return result
}

export default apifoxDataToTireSeed