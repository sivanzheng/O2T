import { compile, JSONSchema } from 'json-schema-to-typescript'
import formatPath from '../utils/formatPath'
import {
	TIRE_ROOT,
	TireSeed,
	NodeType,
	TOP_LEVEL_NAMESPACE,
} from '../types'

import TireNode from './TireNode'

const compiler = async (schema: JSONSchema) => {
	if (!schema.title) return ''
	const result = await compile(
		schema,
		schema.title,
		{
			additionalProperties: false,
			bannerComment: '',
			unknownAny: true,
			format: false,
			declareExternallyReferenced: true,
		}
	)
	return result.replace('export ', '')
}

const printParentNode = async (node: TireNode) => {
	const parent = `namespace ${node.part} { `
		+ await printChildNode(node, true)
		+ await printChildren(node)
		+ ' }'
	return parent
}

const printChildNode = async (node: TireNode, hasWrapper = false) => {
	let row = ''
	if (!node.content) return ''
	if (node.content.params) {
		const compiled = await compiler(node.content.params)
		row += compiled + ';'
	}

	if (node.content.body) {
		const compiled = await compiler(node.content.body)
		row += compiled + ';'
	}

	if (node.content.response) {
		const compiled = await compiler(node.content.response)
		row += compiled
	}

	if (!hasWrapper) {
		row = `namespace ${node.part} \{ ${row} \};`
	}

	const child = `
	\/\*\*
	 \* \@description Response Interface
	 \* \@method ${node.content.method}
	 \* \@path ${node.path || ''}
	 \*\/
	${row}
	`
	return child
}

const printNamespace = async (node: TireNode) => {
	if (node.type === NodeType.ROOT) {
		return await printChildren(node)
	}
	const prefix = TOP_LEVEL_NAMESPACE.includes(node.part) ? 'export' : ''
	const namespace = `${prefix} namespace ${node.part} \{ `
		+ await printChildren(node)
		+ ' };'
	return namespace
}

const printChildren = async (node: TireNode) => {
	let result = ''
	for (const child of node.arrayChildren) {
		result += await printNode(child)
	}
	return result
}

const printNode = async (node: TireNode) => {
	if (node.type === NodeType.PARENT_NODE) return await printParentNode(node)
	if (node.type === NodeType.CHILD_NODE) return await printChildNode(node)
	if (node.type === NodeType.NAMESPACE) return await printNamespace(node)
	if (node.type === NodeType.ROOT) return await printChildren(node)
	return ''
}

export default class Tire {
	public root: TireNode
	public result: string

	constructor() {
		this.root = new TireNode(TIRE_ROOT)
		this.result = ''
	}

	insert(seed: TireSeed): void {
		let node = this.root
		const parts = seed.path.split('/').filter(v => !!v)
		for (const part of parts) {
			const p = formatPath(part)
			let childNode = node.children.get(p)
			if (!childNode) {
				childNode = new TireNode(p)
				node.children.set(p, childNode)
			}
			node = childNode
		}
		node.content = seed.content
		node.path = seed.originalPath
	}

	async traverse(node: TireNode) {
		if (node.type === NodeType.ROOT) {
			this.result = `
				/* eslint-disable */
				${await printNode(node)}
			`
		}
	}

	async build() {
		await this.traverse(this.root)
		return this.result
	}
}