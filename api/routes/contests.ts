import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";

import {
	annotateContestAPI,
	transformContestAPI,
} from "../../transformers/contest";
import { getGallery } from "../utils/gallery";

export const gallery = await getGallery();

export const routeGETContestsMy: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contests = await db
		.selectFrom("contests")
		.leftJoin("bookmarks", (join) =>
			join
				.onRef("bookmarks.contest_id", "=", "contests.id")
				.on("bookmarks.user_id", "=", user_id),
		)
		.select([
			"contests.id",
			"contests.slug",
			"contests.title",
			"contests.image",
			"contests.theme",
			"contests.date_end",
			"contests.owner_id",
			"contests.prize",
			"contests.verified",
			"contests.announced",
			"bookmarks.id as bookmark_id",
		])
		.where((eb) =>
			eb.and([
				eb("contests.status", "=", 1),
				eb.or([
					eb("contests.owner_id", "=", user_id),
					eb.exists(
						eb
							.selectFrom("moderators")
							.whereRef("moderators.contest_id", "=", "contests.id")
							.where("moderators.user_id", "=", user_id)
							.selectAll(),
					),
					eb.exists(
						eb
							.selectFrom("submissions")
							.whereRef("submissions.contest_id", "=", "contests.id")
							.where("submissions.user_id", "=", user_id)
							.selectAll(),
					),
					eb.exists(
						eb
							.selectFrom("bookmarks")
							.whereRef("bookmarks.contest_id", "=", "contests.id")
							.where("bookmarks.user_id", "=", user_id)
							.selectAll(),
					),
				]),
			]),
		)
		.orderBy("contests.id", "desc")
		.execute();

	return {
		status: "success",
		result: {
			contests: await Promise.all(
				contests.map(async (contest) => ({
					contest: await transformContestAPI(contest),
					metadata: await annotateContestAPI(contest, user_id),
				})),
			),
			gallery: gallery,
		},
	};
};

export const routeGETContestsGallery: Handler = async () => {
	return {
		status: "success",
		result: {
			gallery,
		},
	};
};

setInterval(async () => {
	gallery.splice(0, gallery.length);
	gallery.push(...(await getGallery()));
}, 60_000);
