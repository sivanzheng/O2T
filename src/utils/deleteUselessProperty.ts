import { ApiFoxSchema } from '../types'

const deleteUselessProperty = (schema: ApiFoxSchema) => {
	delete schema['x-apifox']
	delete schema['x-apifox-orders']
	delete schema['x-apifox-ignore-properties']
	return schema
}

export default deleteUselessProperty