import fs from "node:fs";
import type { GalleryItem } from "../../schema";
import { transformContestAPI } from "../../transformers/contest";
import { db } from "../../utils/database";
import { t } from "../../utils/i18n";

export const getGallery = async (): Promise<GalleryItem[]> => {
	try {
		const items: GalleryItem[] = JSON.parse(
			fs.readFileSync(`${__dirname}/../../gallery.json`).toString(),
		);

		const contest_ids: number[] = items
			.filter((i) => i.type === "section")
			.flatMap((i) => i.items as any);

		const contests = await Promise.all(
			(
				await db
					.selectFrom("contests")
					.select(["id", "title", "theme", "slug"])
					.where("id", "in", contest_ids.length > 0 ? contest_ids : [-1])
					.execute()
			).map((contest) => transformContestAPI(contest)),
		);

		const gallery = items.map((item) => {
			if (item.type === "section") {
				const { type, items, title } = item;

				return {
					type,
					title: t("en", title as any),
					items: items.map(
						(i: any) => contests.find((item) => item.id === i)!,
					) as any,
				} satisfies GalleryItem;
			}

			return item;
		});

		return gallery;
	} catch (_) {}

	return [];
};
