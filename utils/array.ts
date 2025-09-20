export function arrayChunk<T>(array: T[], size: number): T[][] {
	if (size <= 0) throw new Error("Chunk size must be greater than 0");
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
}
