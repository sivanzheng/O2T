import { ApifoxSchema } from '../models'

const deleteUselessProperty = (schema: ApifoxSchema) => {
	delete schema['x-apifox']
	delete schema['x-apifox-orders']
	delete schema['x-apifox-ignore-properties']
	return schema
}

export default deleteUselessProperty