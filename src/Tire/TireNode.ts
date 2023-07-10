import toCamelCase from '../utils/toCamelCase'
import {
	TireSeedContent,
	TIRE_ROOT,
	NodeType,
} from '../types'

export default class TireNode {
	public part: string
	public children: Map<string, TireNode>
	public path?: string
	public content?: TireSeedContent

	constructor(
		part: string,
		path?: string,
		content?: TireSeedContent
	) {
		this.path = path
		this.part = toCamelCase(part)
		this.content = content
		this.children = new Map()
	}

	get type() {
		if (this.part === TIRE_ROOT) return NodeType.ROOT
		if (this.path && !this.children.size && this.content) return NodeType.CHILD_NODE
		if (this.path && this.children.size && this.content) return NodeType.PARENT_NODE
		if (!this.path && this.children.size && !this.content) return NodeType.NAMESPACE
	}

	get arrayChildren() {
		if (this.children.size === 0) return []
		return Array.from(this.children.values())
	}
}