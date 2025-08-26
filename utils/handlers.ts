import {
	handleContestAnnounced,
	handleContestBeforeDelete,
	handleContestBookmarked,
	handleContestCreated,
	handleContestDeleted,
	handleContestSubmitted,
	handleContestUpdated,
} from "../events/contests";
import {
	handleModeratorJoined,
	handleModeratorRemoved,
	handleModeratorsRevoked,
} from "../events/moderators";
import { events } from "./events";

export const initializeEventHandlers = () => {
	events.on("contestCreated", handleContestCreated);
	events.on("contestBeforeDelete", handleContestBeforeDelete);
	events.on("contestDeleted", handleContestDeleted);
	events.on("contestBookmarked", handleContestBookmarked);
	events.on("contestSubmitted", handleContestSubmitted);
	events.on("contestAnnounced", handleContestAnnounced);
	events.on("contestUpdated", handleContestUpdated);
	events.on("moderatorJoined", handleModeratorJoined);
	events.on("moderatorRemoved", handleModeratorRemoved);
	events.on("moderatorsLinkRevoked", handleModeratorsRevoked);
};
