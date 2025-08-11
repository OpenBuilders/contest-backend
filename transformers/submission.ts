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
	const { id, submission: submissionInfo, likes, dislikes } = submission;

	const user = transformUserAPI(submission as any);

	const likes_count = JSON.parse(likes as any).length;
	const dislikes_count = JSON.parse(dislikes as any).length;

	return {
		id,
		submission: JSON.parse(submissionInfo ?? "[]"),
		likes: likes_count,
		dislikes: dislikes_count,
		...user,
	} as TransformedSubmission;
};

export const annotateSubmission = (
	submission: Partial<DBSchema["submissions"]> & Partial<DBSchema["users"]>,
	requester_id: number | undefined = undefined,
) => {
	const { likes: likesString, dislikes: dislikesString } = submission;

	const likes = JSON.parse(likesString as any) as number[];
	const dislikes = JSON.parse(dislikesString as any) as number[];

	const liked_by_viewer = likes.includes(requester_id!);
	const disliked_by_viewer = dislikes.includes(requester_id!);

	return {
		liked_by_viewer,
		disliked_by_viewer,
	};
};
