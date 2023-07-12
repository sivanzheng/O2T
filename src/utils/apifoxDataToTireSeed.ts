import { JSONSchema } from 'json-schema-to-typescript'

import deleteUselessProperty from '../utils/deleteUselessProperty'
import firstLetterToUpperCase from '../utils/firstLetterToUpperCase'
import {
	ApiFoxData,
	APIStatus,
	Methods,
	Responses,
	TireSeed,
	TireSeedContent,
	Properties,
} from '../types'

const formatSchema = (schema: JSONSchema, title = '') => {
	const formatProperties = (properties?: Properties) => {
		if (!properties) return

		const innerResult: Properties = {}

		for (const property of Object.keys(properties)) {
			const propertyValue = properties[property]
			const value = deleteUselessProperty(propertyValue)

			switch (value.type) {
			case 'object':
				innerResult[property] = {
					type: value.type,
					required: value.required,
					additionalProperties: false,
					title: firstLetterToUpperCase(property),
					properties: formatProperties(value.properties)
				}
				break
			case 'array':
				if (value.items && !Array.isArray(value.items)) {
					const formattedProperties = formatProperties(value.items.properties)
					if (formattedProperties) {
						innerResult[property] = {
							type: value.type,
							required: value.required,
							title: firstLetterToUpperCase(property),
							additionalProperties: false,
							items: {
								...value['items'],
								properties: {
									...formatProperties(value.items.properties)	
								}
							}
						}
					} else {
						innerResult[property] = {
							...value,
							title: firstLetterToUpperCase(property),
						}
					}
				}
				break
			default:
				innerResult[property] = {
					...innerResult[property],
					// Replace Title
					...formatSchema(value, property),
				}
			}
		}
		return innerResult
	}

	const result: Properties = {}
	if (!schema) return result
	
	if (
		schema.type === 'array'
		&& schema.items
		&& !Array.isArray(schema.items)
	) {
		const value = schema.items as JSONSchema
		if (!value.properties) return schema
		
		return ({
			...schema,
			items: {
				...schema.items,
				properties: {
					...formatProperties(value.properties),
				}	
			},
			title: firstLetterToUpperCase(title || ''),
		})
	}
	
	if (!schema.properties) {
		return ({
			...schema,
			title: firstLetterToUpperCase(title || ''),
		})
	}
	
	return formatProperties(schema.properties)
}

const apifoxDataToTireSeed = (data: ApiFoxData, apiStatus: APIStatus[]) => {
	const result: TireSeed[] = []

	const jsonContentToSchema = (jsonContent: { schema: JSONSchema }) => {
		const { schema } = jsonContent
		return formatSchema(schema, schema.title)
	}

	const responsesToSchema = (responses: Responses): JSONSchema => {
		const successResponse = responses['200']
		if (!successResponse) return {}
		const jsonContent = successResponse.content['application/json']
		if (!jsonContent) return {}
		const schema = jsonContentToSchema(jsonContent)
		return ({
			title: 'Response',
			additionalProperties: false,
			required: jsonContent.schema.required,
			properties: {
				...schema,
			},
			components: {
				...data.components
			}
		}) as JSONSchema
	}

	for (const url of Object.keys(data.paths)) {
		const apiData = data.paths[url]
		
		if (!apiData) continue

		// Format GET Data
		const getInfo = apiData['get']
		if (getInfo && apiStatus.includes(getInfo['x-apifox-status'])) {
			const content: TireSeedContent = { method: Methods.GET }

			// Request params to schema
			const properties: Properties = {}
			const { parameters } = getInfo
			if (parameters) {
				for (const parameter of parameters) {
					if (parameter.in === 'query') {
						const schema = formatSchema(
							parameter.schema,
							`Params${firstLetterToUpperCase(parameter.name)}`
						)
						if (schema) {
							properties[parameter.name] = schema
						}
					}
					
				}
				content.params = {
					title: 'Params',
					type: 'object',
					additionalProperties: false,
					properties: {
						...properties,
					},
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
		if (postInfo && apiStatus.includes(postInfo['x-apifox-status'])) {
			const content: TireSeedContent = { method: Methods.POST }
			const { requestBody } = postInfo

			

			// Request body to schema
			if (requestBody && requestBody.content) {
				const jsonContent = requestBody.content['application/json']
				if (jsonContent) {
					const schema = jsonContentToSchema(jsonContent)
					const body = {
						title: 'Body',
						additionalProperties: false,
						required: jsonContent.schema.required,
					}
					if (schema?.type === 'array') {
						content.body = {
							...schema,	
							...body,
						}
					} else {
						content.body = ({
							...body,
							properties: {
								...schema,
							}
						}) as JSONSchema
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
		if (deleteInfo && apiStatus.includes(deleteInfo['x-apifox-status'])) {
			const content: TireSeedContent = { method: Methods.DELETE }
			// Request params to schema
			const properties: Properties = {}
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
		if (putInfo && apiStatus.includes(putInfo['x-apifox-status'])) {
			const content: TireSeedContent = { method: Methods.PUT }
			const { requestBody } = putInfo

			// Request body to schema
			if (requestBody && requestBody.content) {
				const jsonContent = requestBody.content['application/json']
				if (jsonContent) {
					const schema = jsonContentToSchema(jsonContent)
					content.body = ({
						title: 'Body',
						additionalProperties: false,
						required: jsonContent.schema.required,
						properties: {
							...schema,
						}
					}) as JSONSchema
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