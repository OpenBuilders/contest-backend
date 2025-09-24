import type { DBSchema } from "../schema";
import { transformUserAPI } from "./user";

type TransformedSubmission = Partial<DBSchema["submissions"]> &
	Partial<DBSchema["users"]> & {
		submission: {
			link: string;
			description?: string;
		};
		likes: number;
		dislikes: number;
	};

export const transformSubmission = (
	submission: Partial<DBSchema["submissions"]> & Partial<DBSchema["users"]>,
) => {
	const {
		id,
		submission: submissionInfo,
		likes,
		dislikes,
		created_at,
	} = submission;

	const user = transformUserAPI(submission as any);

	const likes_count = likes?.length;
	const dislikes_count = dislikes?.length;

	return {
		id,
		submission: submissionInfo ?? [],
		likes: likes_count,
		dislikes: dislikes_count,
		created_at,
		...user,
	} as TransformedSubmission;
};

export const annotateSubmission = (
	submission: Partial<DBSchema["submissions"]> & Partial<DBSchema["users"]>,
	requester_id: number | undefined = undefined,
) => {
	const { likes, dislikes } = submission;

	const liked_by_viewer = likes?.includes(requester_id!);
	const disliked_by_viewer = dislikes?.includes(requester_id!);

	return {
		liked_by_viewer,
		disliked_by_viewer,
	};
};
