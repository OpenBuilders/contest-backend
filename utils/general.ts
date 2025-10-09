export const getRandomItemFromArray = <T>(arr: T[]): T | undefined =>
	arr[Math.floor(Math.random() * arr.length)];

export function isEqual(a: any, b: any): boolean {
	// Fast path for strict equality or same reference
	if (a === b) return true;

	// Handle null or different types
	if (a === null || b === null || typeof a !== typeof b) return false;

	// Handle Date objects
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}

	// Handle Array comparison
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => isEqual(item, b[index]));
	}

	// Handle object comparison
	if (typeof a === "object" && typeof b === "object") {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		return keysA.every((key) => isEqual(a[key], b[key]));
	}

	// Fallback for primitive values
	return false;
}
