
/**
 * Remove unnecessary symbols, "{" "}" "?" .
 * @param part Clean string
 * @returns {string} Formatted string
 */
export const formatPart = (part: string): string => part.replace(/{|}|\?/g, '')

/**
  * Make first letter to be upper case
  * @param str string
  * @returns {string} Formatted string
  */
export const firstLetterUpperCase = (str: string): string => str.slice(0,1).toUpperCase() +str.slice(1)
 
/**
  * Format Path String
  * @param str string
  * @returns {string} Formatted String
  */
const formatPath = (str: string): string => firstLetterUpperCase(formatPart(str))

export default formatPath