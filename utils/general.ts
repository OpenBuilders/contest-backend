export const getRandomItemFromArray = <T>(arr: T[]): T | undefined =>
	arr[Math.floor(Math.random() * arr.length)];
