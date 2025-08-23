import type { Handler } from "elysia";
import type { JWTInjections, PoolInjections } from "../../api";
import { transformContestAPI } from "../../transformers/contest";

export const routeGETAchievementsMy: Handler = async (ctx) => {
	const { db, user_id }: JWTInjections & PoolInjections = ctx as any;

	const contests = await db
		.selectFrom("contests")
		.select([
			"contests.slug",
			"contests.title",
			"contests.image",
			"contests.theme",
			"contests.results",
		])
		.where((eb) =>
			eb.exists(
				eb
					.selectFrom("submissions")
					.whereRef("submissions.contest_id", "=", "contests.id")
					.where("submissions.user_id", "=", user_id)
					.selectAll(),
			),
		)
		.where("contests.announced", "=", 1)
		.orderBy("contests.id", "desc")
		.execute();

	const achievements = (
		await Promise.all(
			contests.map((contest) => transformContestAPI(contest, false)),
		)
	)
		.filter((contest) => {
			return (
				contest.results!.findIndex(
					(result) =>
						result.submissions.findIndex(
							(submission: any) => submission.user_id === user_id,
						) > -1,
				) > -1
			);
		})
		.map((contest) => {
			const { slug, title, image, theme } = contest;

			const placement = contest.results!.find(
				(result) =>
					result.submissions.findIndex(
						(submission: any) => submission.user_id === user_id,
					) > -1,
			);

			return {
				slug,
				title,
				image,
				theme,
				placement: {
					name: placement?.name,
					prize: placement?.prize,
				},
			};
		});

	return {
		status: "success",
		result: {
			achievements: achievements,
		},
	};
};
