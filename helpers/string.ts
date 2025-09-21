import { CryptoHasher } from "bun";

export function truncateString(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}

export function generateRandomHash() {
	return CryptoHasher.hash(
		"md5",
		`${Math.random()}-${Date.now()}-${Math.random()}`,
	).toHex();
}
