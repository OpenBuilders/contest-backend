const memoStore = new Map<string, { value: any; expiresAt: number }>();
const inFlight = new Map<string, Promise<any>>();

export const memo = async <T>(
	key: string,
	generator: () => T | Promise<T>,
	ttl_millis: number,
): Promise<T> => {
	const now = Date.now();
	const memoed = memoStore.get(key);

	if (memoed && memoed.expiresAt > now) {
		return memoed.value;
	}

	if (inFlight.has(key)) {
		return inFlight.get(key)!;
	}

	const promise = Promise.resolve(generator())
		.then((value) => {
			memoStore.set(key, {
				value,
				expiresAt: Date.now() + ttl_millis,
			});
			inFlight.delete(key);
			return value;
		})
		.catch((err) => {
			inFlight.delete(key);
			throw err;
		});

	inFlight.set(key, promise);
	return promise;
};
