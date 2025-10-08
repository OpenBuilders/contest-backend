import type { DBSchema } from "../schema";
import { t } from "../utils/i18n";

export const transformUserAPI = (user: DBSchema["users"]) => {
	const {
		first_name,
		last_name,
		language,
		profile_photo,
		user_id,
		anonymous_profile,
	} = user;

	const anonymous_profile_transformed = [];

	anonymous_profile_transformed[0] = (anonymous_profile as any)[0];

	anonymous_profile_transformed[1] = [
		(anonymous_profile as any)[1],
		t(
			(language ?? "en") as any,
			`aliases.adjectives.${(anonymous_profile as any)[1]}` as any,
		),
	];

	anonymous_profile_transformed[2] = [
		(anonymous_profile as any)[2],
		t(
			(language ?? "en") as any,
			`aliases.animals.${(anonymous_profile as any)[2]}` as any,
		),
	];

	return {
		first_name,
		last_name,
		language,
		profile_photo,
		user_id,
		anonymous_profile: anonymous_profile_transformed,
	};
};
