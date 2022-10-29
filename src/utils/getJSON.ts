import http from 'http'

const getJSON = (url: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		http.get(
			url,
			(res) => {
				let data = ''
				res.on('data', chunk => {
					data += chunk
				})
				res.on('end', () => {
					try {
						resolve(data)
					} catch (err) {
						throw new Error(err as string)
					}
				})
			}
		).on('error', (err) => {
			reject(err)
		})
	})
}

export default getJSON