import type { DBSchema } from "../schema";
import { db } from "../utils/database";
import { transformUserAPI } from "./user";

type TransformedSubmission = Partial<DBSchema["submissions"]> &
	Partial<DBSchema["users"]> & {
		submission: {
			description?: string;
		};
		likes: number;
		dislikes: number;
		raises: number;
		liked_by: Partial<DBSchema["users"]>[];
		disliked_by: Partial<DBSchema["users"]>[];
		raised_by: Partial<DBSchema["users"]>[];
	};

export const transformSubmission = async (
	submission: Partial<DBSchema["submissions"]> & Partial<DBSchema["users"]>,
) => {
	const { id, submission: submissionInfo, created_at } = submission;

	const user = transformUserAPI(submission as any);

	const votes = await db
		.selectFrom("votes")
		.select(["vote", "user_id", "comment", "created_at"])
		.where("submission_id", "=", id as any)
		.execute();

	const likes = votes.filter((i) => Number.parseInt(i.vote as any, 10) === 1);
	const dislikes = votes.filter(
		(i) => Number.parseInt(i.vote as any, 10) === 0,
	);
	const raises = votes.filter((i) => Number.parseInt(i.vote as any, 10) === 2);

	const likes_count = likes.length ?? 0;
	const dislikes_count = dislikes.length ?? 0;
	const raises_count = raises.length ?? 0;

	const voters = votes.map((i) => i.user_id);

	const users =
		voters.length > 0
			? await db
					.selectFrom("users")
					.select(["first_name", "last_name", "profile_photo", "user_id"])
					.where("user_id", "in", voters)
					.execute()
			: [];

	const liked_by = likes
		?.map((i) => ({
			...users.find(
				(u) =>
					Number.parseInt(u.user_id as any, 10) ===
					Number.parseInt(i.user_id as any, 10),
			),
			comment: i.comment,
			created_at: i.created_at,
		}))
		.filter(Boolean);

	const disliked_by = dislikes
		?.map((i) => ({
			...users.find(
				(u) =>
					Number.parseInt(u.user_id as any, 10) ===
					Number.parseInt(i.user_id as any, 10),
			),
			comment: i.comment,
			created_at: i.created_at,
		}))
		.filter(Boolean);

	const raised_by = raises
		?.map((i) => ({
			...users.find(
				(u) =>
					Number.parseInt(u.user_id as any, 10) ===
					Number.parseInt(i.user_id as any, 10),
			),
			comment: i.comment,
			created_at: i.created_at,
		}))
		.filter(Boolean);

	return {
		id,
		submission: submissionInfo ?? [],
		likes: likes_count,
		dislikes: dislikes_count,
		raises: raises_count,
		disliked_by,
		liked_by,
		raised_by,
		created_at,
		...user,
	} as any as TransformedSubmission;
};

export const annotateSubmission = async (
	submission: Partial<DBSchema["submissions"]> & Partial<DBSchema["users"]>,
	requester_id: number | undefined = undefined,
) => {
	const { id } = submission;

	const vote = await db
		.selectFrom("votes")
		.select(["vote"])
		.where("submission_id", "=", id as any)
		.where("user_id", "=", requester_id as any)
		.executeTakeFirst();

	const raised_by_viewer =
		Number.parseInt((vote?.vote ?? "-1") as any, 10) === 2;
	const liked_by_viewer =
		Number.parseInt((vote?.vote ?? "-1") as any, 10) === 1;
	const disliked_by_viewer =
		Number.parseInt((vote?.vote ?? "-1") as any, 10) === 0;

	return {
		liked_by_viewer,
		disliked_by_viewer,
		raised_by_viewer,
	};
};
