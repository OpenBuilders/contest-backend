type Listener<T = any> = (data: T) => void;

export class EventEmitter<
	Events extends Record<string, any> = Record<string, any>,
> {
	private events: Map<keyof Events, Set<Listener>> = new Map();

	on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
		if (!this.events.has(event)) {
			this.events.set(event, new Set());
		}
		this.events.get(event)!.add(listener);
	}

	once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
		const wrapper = (data: Events[K]) => {
			this.off(event, wrapper);
			listener(data);
		};
		this.on(event, wrapper);
	}

	off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
		this.events.get(event)?.delete(listener);
		if (this.events.get(event)?.size === 0) {
			this.events.delete(event);
		}
	}

	emit<K extends keyof Events>(event: K, data: Events[K]): void {
		this.events.get(event)?.forEach((listener) => listener(data));
	}

	removeAllListeners<K extends keyof Events>(event?: K): void {
		if (event) {
			this.events.delete(event);
		} else {
			this.events.clear();
		}
	}

	listenerCount<K extends keyof Events>(event: K): number {
		return this.events.get(event)?.size || 0;
	}

	listeners<K extends keyof Events>(event: K): Listener<Events[K]>[] {
		return Array.from(this.events.get(event) ?? []);
	}
}

export type Events = {
	contestCreated: { contest_id: number; user_id: number };
	contestBeforeDelete: { contest_id: number; user_id: number };
	contestDeleted: { contest_id: number; user_id: number };
	contestBookmarked: { contest_id: number; user_id: number };
	contestSubmitted: {
		contest_id: number;
		user_id: number;
	};
};

export const events = new EventEmitter<Events>();
