export const getRandomIntInclusive = (min: number, max: number): number => {
	const lower = Math.ceil(min);
	const upper = Math.floor(max);
	return Math.floor(Math.random() * (upper - lower + 1)) + lower;
};

export const randomLong = () => {
	const min = Number.MIN_SAFE_INTEGER;
	const max = Number.MAX_SAFE_INTEGER;
	return Math.abs(Math.floor(Math.random() * (max - min + 1)) + min);
};
