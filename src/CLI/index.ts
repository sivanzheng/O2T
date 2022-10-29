import { Command } from 'commander'

const CLI = new Command()

CLI
	.option('-u --url', 'URL of OpenApi')
	.option('-n --name', 'Name for Generated file')

CLI.parse()

export default CLI