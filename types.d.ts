export type NestedPaths<T, Prev extends string = ""> = {
	[K in keyof T]: T[K] extends string
		? `${Prev}${K & string}`
		: NestedPaths<T[K], `${Prev}${K & string}.`>;
}[keyof T];

export type ExtractParams<S extends string> =
	S extends `${string}{${infer Param}}${infer Rest}`
		? { [K in Param | keyof ExtractParams<Rest>]: string }
		: {};
