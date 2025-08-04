import {
	handleContestBookmarked,
	handleContestCreated,
	handleContestDeleted,
	handleContestSubmitted,
} from "../events/contests";
import { events } from "./events";

export const initializeEventHandlers = () => {
	events.on("contestCreated", handleContestCreated);
	events.on("contestDeleted", handleContestDeleted);
	events.on("contestBookmarked", handleContestBookmarked);
	events.on("contestSubmitted", handleContestSubmitted);
};
