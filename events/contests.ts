import { db } from "../utils/database";
import type { Events } from "../utils/events";

export const handleContestCreated = (data: Events["contestCreated"]) => {};

export const handleContestUpdated = (data: Events["contestUpdated"]) => {};

export const handleContestBeforeDelete = async (
	data: Events["contestBeforeDelete"],
) => {
	const { contest_id } = data;

	await db
		.deleteFrom("moderators")
		.where("contest_id", "=", contest_id)
		.execute();

	await db
		.deleteFrom("bookmarks")
		.where("contest_id", "=", contest_id)
		.execute();
};

export const handleContestDeleted = async (
	data: Events["contestDeleted"],
) => {};

export const handleContestBookmarked = (
	data: Events["contestBookmarked"],
) => {};

export const handleContestSubmitted = (data: Events["contestSubmitted"]) => {
	console.log(data);
};
