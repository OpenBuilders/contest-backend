import dictionary_default from "../i18n/fa";
import type { ExtractParams, NestedPaths } from "../types";

type Dictionary = typeof dictionary_default;

const dictionaries = {
	fa: dictionary_default,
};

type Languages = keyof typeof dictionaries;
type TranslationKey = NestedPaths<Dictionary>;

function getValue(obj: any, path: string): string {
	return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function t<L extends Languages, K extends TranslationKey>(
	lang: L,
	key: K,
	params?: ExtractParams<GetTranslation<K>>,
): string {
	const template = getValue(dictionaries[lang], key);
	if (typeof template !== "string") return "";

	return template.replace(/{(\w+)}/g, (_, match: string) => {
		return (params as Record<string, string>)[match] ?? `{${match}}`;
	});
}

type GetTranslation<K extends TranslationKey> = K extends keyof any
	? K extends NestedPaths<typeof dictionary_default>
		? GetPathValue<typeof dictionary_default, K>
		: never
	: never;

type GetPathValue<
	T,
	Path extends string,
> = Path extends `${infer Head}.${infer Tail}`
	? Head extends keyof T
		? GetPathValue<T[Head], Tail>
		: never
	: Path extends keyof T
		? T[Path]
		: never;
