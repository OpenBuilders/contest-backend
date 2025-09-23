import type { GalleryItem } from "../../schema";
import {
	annotateContestAPI,
	transformContestAPI,
} from "../../transformers/contest";
import { db } from "../../utils/database";
import { t } from "../../utils/i18n";

export const getGallery = async (): Promise<GalleryItem[]> => {
	try {
		const items: GalleryItem[] = JSON.parse(
			(
				await db
					.selectFrom("settings")
					.select(["value"])
					.where("meta", "=", "gallery")
					.executeTakeFirst()
			)?.value ?? "[]",
		);

		const contest_ids: number[] = items
			.filter((i) => i.type === "section")
			.flatMap((i) => i.items as any);

		const contests = await Promise.all(
			(
				await db
					.selectFrom("contests")
					.select([
						"id",
						"title",
						"theme",
						"slug",
						"image",
						"date_end",
						"announced",
						"prize",
						"contests.verified",
					])
					.where("id", "in", contest_ids.length > 0 ? contest_ids : [-1])
					.execute()
			).map(async (contest) => ({
				contest: await transformContestAPI(contest),
				metadata: await annotateContestAPI(contest, -1),
			})),
		);

		const gallery = items.map((item) => {
			if (item.type === "section") {
				const { type, items, id } = item;

				return {
					type,
					id,
					title: item.title,
					items: items.map(
						(i: any) => contests.find((item) => item.contest.id === i)!,
					) as any,
				} satisfies GalleryItem;
			}

			return item;
		});

		return gallery;
	} catch (_) {}

	return [];
};
