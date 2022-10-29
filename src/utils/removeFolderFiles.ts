import fs from 'fs'

const removeFolderFiles = (path: string) => {
	let files = []
	if (fs.existsSync(path)) {
		files = fs.readdirSync(path)
		files.forEach((file) => {
			const curPath = path + '/' + file
			if (fs.statSync(curPath).isDirectory()) {
				removeFolderFiles(curPath)
			} else {
				fs.unlinkSync(curPath)
			}
		})
	}
}

export default removeFolderFiles