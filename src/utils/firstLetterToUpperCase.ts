export default function firstLetterToUpperCase(word: string) {
	return word.charAt(0).toUpperCase() + word.slice(1)
}