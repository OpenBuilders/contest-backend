import type { Events } from "../utils/events";

export const handleContestCreated = (data: Events["contestCreated"]) => {};

export const handleContestDeleted = (data: Events["contestDeleted"]) => {};

export const handleContestBookmarked = (
	data: Events["contestBookmarked"],
) => {};

export const handleContestSubmitted = (data: Events["contestSubmitted"]) => {
	console.log(data);
};
