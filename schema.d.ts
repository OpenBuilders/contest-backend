export type BoolInt = 0 | 1;

export type DBSchema = {
	contests: {
		id?: number;
		slug: string;
		slug_moderator: string;
		owner_id: number;
		moderators?: number[];
		title: string;
		description: string;
		fee: number;
		prize?: string;
		public: BoolInt;
		anonymous: BoolInt;
		verified?: BoolInt;
		category?: string;
		image?: string;
		theme?: {
			backdrop?: number;
			symbol?: string;
		};
		date_end: number;
	};

	users: {
		id?: number;
		user_id: number;
		first_name: string;
		last_name?: string;
		profile_photo?: string;
		premium?: BoolInt;
		anonymous_profile: [number, string, string];
		language: string;
	};

	submissions: {
		id?: number;
		user_id: number;
		contest_id: number;
		submission: string;
		likes?: number[];
		dislikes?: number[];
	};

	bookmarks: {
		id?: number;
		user_id: number;
		contest_id: number;
	};

	moderators: {
		id?: number;
		user_id: number;
		contest_id: number;
	};
};
