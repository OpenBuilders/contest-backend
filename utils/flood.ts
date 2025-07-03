const floodMap: Map<
	string,
	Map<number, { timestamp: number; count: number; limit: number }>
> = new Map();

export const isUserFlooding = (
	context: string,
	user_id: number,
	messages_count: number,
	per_n_seconds: number,
	release_after_n_seconds: number,
): boolean | undefined => {
	const time = Math.trunc(Date.now() / 1000);

	if (!floodMap.has(context)) {
		floodMap.set(context, new Map());
	}

	const contextMap = floodMap.get(context)!;

	if (!contextMap.get(user_id)) {
		contextMap.set(user_id, {
			count: 0,
			limit: release_after_n_seconds,
			timestamp: time,
		});

		return false;
	}

	const userMap = contextMap.get(user_id)!;

	if (time >= userMap.timestamp + per_n_seconds) {
		userMap.count = 0;
		userMap.timestamp = time;
		userMap.limit = release_after_n_seconds;
	} else {
		userMap.count++;
		userMap.timestamp = time;
	}

	if (userMap.count < messages_count) {
		return false;
	} else if (userMap.count === messages_count) {
		return true;
	}

	return undefined;
};

setInterval(() => {
	const time = Math.trunc(Date.now() / 1000);

	for (const [, context] of floodMap) {
		for (const [userId, user] of context) {
			if (time >= user.limit + user.timestamp) {
				context.delete(userId);
			}
		}
	}
}, 60_000);
