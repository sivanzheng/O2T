#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import prettier from 'prettier'
import { spawn } from 'promisify-child-process'

import Tire from './Tire'
import getJSON from './utils/getJSON'
import apifoxDataToTireSeed from './utils/apifoxDataToTireSeed'
import removeFolderFiles from './utils/removeFolderFiles'

import CLI from './CLI'
import * as config from '../config'

const generateByJSONString = async (str: string) => {
	const tire = new Tire()
	const tireSeeds = apifoxDataToTireSeed(JSON.parse(str))
	for (const seed of tireSeeds) {
		tire.insert(seed)
	}
	const result = await tire.build()
	const formatted = prettier.format(result, { parser: 'babel-ts' })
	return formatted
}

const generateByRemoteJSON = async (url: string) => {
	const data = await getJSON(url)
	return await generateByJSONString(data)
}

const createFiles = async (data: string, name: string) => {
	const generatedPath = path.resolve(__dirname, '../', 'generated') 
	const filePath = (filename: string) => path.join(generatedPath, filename)

	const isExist = fs.existsSync(generatedPath)
	if (!isExist) {
		fs.mkdirSync(generatedPath)
	}  else {
		removeFolderFiles(generatedPath)
	}
    
	const indexFilePath = filePath('index.d.ts')
	fs.writeFileSync(indexFilePath, data)

	const version = `1.0.0-${new Date().valueOf()}`
	const packageName = `@types/${name}`
	const packageJson = {
		name: packageName,
		version: `${version}`,
		main: 'index.d.ts',
		author: config.AUTHOR,
		license: 'MIT'
	}

	fs.writeFileSync(
		filePath('package.json'),
		JSON.stringify(packageJson, null, 4),
	)

	console.log(`The TypeScript definitions file has been successfully generated to: ${process.cwd()}/generated `, '\n')
	return `${packageName}@${version}`
}

const publishToNPM = async (name: string, tag: string) => {
	console.log('Ready to publish to NPM...', '\n')
	const { stdout, stderr } = await spawn(
		`sh ${path.resolve(__dirname, '../')}/publish.sh`,
		[],
		{
			stdio: 'inherit',
			encoding: 'utf8',
			shell: true,
			env: {
				...process.env,
				REGISTRY: config.REGISTRY,
				USERNAME: config.USERNAME,
				PASSWORD: config.PASSWORD,
				EMAIL: config.EMAIL
			},
		}
	)
	console.log(stdout)
	console.log(stderr)
	console.log(`The TypeScript definitions for ${name} was published to NPM.`, '\n')
	console.log('Copy the following command to use:', '\n')
	console.log(`npm i ${tag} -D`)
}

const generate = async (url: string, fileName: string) => {
	const result = await generateByRemoteJSON(url)
	const tag = await createFiles(result, fileName)
	publishToNPM(fileName, tag)
}

const url = CLI.opts().url
	? CLI.args.shift() as string
	: ''

const filename = CLI.opts().name
	? CLI.args.shift() as string
	: ''

console.log('O2T@1.0.0')
console.log('Data URL: ', url)
console.log('Filename: ', filename)

generate(url, filename)
