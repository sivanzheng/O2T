const toCamelCase = (str: string) => str.replace(/\-(\w)/g, (_, letter) => letter.toUpperCase())

export default toCamelCase