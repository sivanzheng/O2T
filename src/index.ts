#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import prettier from 'prettier'
import { spawn } from 'promisify-child-process'

import Tire from './Tire'
import getJSON from './utils/getJSON'
import apifoxDataToTireSeed from './utils/apifoxDataToTireSeed'
import removeFolderFiles from './utils/removeFolderFiles'
import { APIStatus, ROW_DATA_FILE_NAME, TireSeed, UPDATE_LIST_FILE_NAME } from './types'
import CLI from './CLI'

import * as config from '../config'

const getHistoryRawDataFormLocal = (name: string) => {
	const rawDataPath = path.resolve(process.cwd(), 'node_modules', `${config.PACKAGE_NAME_PREFIX}/${name}`, ROW_DATA_FILE_NAME)
	if (!fs.existsSync(rawDataPath)) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Previous version raw data not found, can not incremental update.')
		process.exit(1)
	}
	const rawData = fs.readFileSync(rawDataPath)
	return rawData.toString()
}

const getUpdateList = () => {
	const updateListPath = path.resolve(process.cwd(), UPDATE_LIST_FILE_NAME)
	if (!fs.existsSync(updateListPath)) {
		return []
	}
	const updateList = fs.readFileSync(updateListPath)
	return updateList.toString().split('\n')
}

const generateAll = async (rawData: string, apiStatus: APIStatus[]) => {
	const tire = new Tire()
	const tireSeeds = apifoxDataToTireSeed(JSON.parse(rawData), apiStatus)
	for (const seed of tireSeeds) {
		tire.insert(seed)
	}
	const result = await tire.build()
	const formatted = prettier.format(result, { parser: 'babel-ts' })
	return formatted
}

const generateDifferentiation = async (
	newestRawData: string,
	historyRawData: string,
	updateList: string[],
	apiStatus: APIStatus[]
) => {
	const historyTireSeeds = apifoxDataToTireSeed(JSON.parse(historyRawData), apiStatus)

	const newestTireSeeds = apifoxDataToTireSeed(JSON.parse(newestRawData), apiStatus)
	const newestSeedMap = new Map<string, TireSeed>()
	for (const seed of newestTireSeeds) {
		newestSeedMap.set(seed.originalPath, seed)
	}

	const updatePathsSet = new Set<string>(updateList)

	const tire = new Tire()
	for (const historySeed of historyTireSeeds) {
		if (updateList.includes(historySeed.originalPath)) {
			const newestSeed = newestSeedMap.get(historySeed.originalPath)
			if (!newestSeed) {
				console.log('\x1b[31m%s\x1b[0m', `Error: Can not find the raw data of ${historySeed.originalPath})`)
				tire.insert(historySeed)
			} else {
				tire.insert(newestSeed)
			}
		} else {
			tire.insert(historySeed)
		}
		updatePathsSet.delete(historySeed.originalPath)
	}
	for (const path of updatePathsSet) {
		const seed = newestSeedMap.get(path)
		if (seed) {
			tire.insert(seed)
			updatePathsSet.delete(seed.originalPath)
		}
	}
	if (updatePathsSet.size) {
		console.log('\x1b[31m%s\x1b[0m', `Error: Can not find the raw data of ${Array.from(updatePathsSet).join(', ')}`)
	}
	const result = await tire.build()
	const formatted = prettier.format(result, { parser: 'babel-ts' })
	return formatted
}

const createFiles = async (data: string, rawData: string, name: string) => {
	const generatedPath = path.resolve(__dirname, '../', 'generated')
	const filePath = (filename: string) => path.join(generatedPath, filename)

	const isExist = fs.existsSync(generatedPath)
	if (!isExist) {
		fs.mkdirSync(generatedPath)
	} else {
		removeFolderFiles(generatedPath)
	}

	const indexFilePath = filePath('index.d.ts')
	fs.writeFileSync(indexFilePath, data)

	const rawDataFilePath = filePath(ROW_DATA_FILE_NAME)
	fs.writeFileSync(rawDataFilePath, rawData)

	const version = `1.0.0-${new Date().valueOf()}`
	const packageName = `${config.PACKAGE_NAME_PREFIX}/${name}`
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

const publishToNPM = async (name: string) => {
	console.log('Ready to publish to npm...', '\n')
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
				USERNAME: config.USER_NAME,
				PASSWORD: config.PASSWORD,
				EMAIL: config.EMAIL, 
			},
		}
	)
	console.log(stdout)
	console.log(stderr)
	console.log(`The TypeScript definitions for ${name} was published to NPM.`, '\n')
}

const install = async (name: string, tag: string) => {
	const { stdout, stderr } = await spawn(
		`sh ${path.resolve(__dirname, '../')}/install.sh`,
		[],
		{
			stdio: 'inherit',
			encoding: 'utf8',
			shell: true,
			env: {
				...process.env,
				NAME: name,
				TAG: tag,
			},
		}
	)
	console.log(stdout)
	console.log(stderr)
}

const generate = async (url: string, fileName: string, apiStatus: APIStatus[]) => {
	const newestRawData = await getJSON(url)

	const updateList = getUpdateList()	
	let generateResult = ''
	if (updateList.length) {
		const historyRawData = getHistoryRawDataFormLocal(fileName)
		generateResult = await generateDifferentiation(newestRawData, historyRawData, updateList, apiStatus)
	} else {
		generateResult = await generateAll(newestRawData,apiStatus)
	}

	const tag = await createFiles(generateResult, newestRawData, fileName)
	await publishToNPM(fileName)
	install(fileName, tag)
}

const url = CLI.opts().url
	? CLI.args.shift() as string
	: ''

const filename = CLI.opts().name
	? CLI.args.shift() as string
	: ''

const status = CLI.opts().status
	? CLI.args.shift() as string
	: 'developing, testing, released, deprecated'
const apiStatus = status.split(',').map(s => s.trim()) as APIStatus[]

console.log('O2T@1.0.0')
console.log('Data URL: ', url)
console.log('Filename: ', filename)
console.log('Generated API status: ', apiStatus)

generate(url, filename, apiStatus)
