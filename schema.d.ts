export type DBSchema = {
	contests: {
		id?: number;
		owner_id: number;
		moderators?: number[];
		title: string;
		description: string;
		price: number;
		public: number;
		anonymous: number;
		category?: number;
		date_start: number;
		date_end: number;
		date_results?: number;
	};

	users: {
		id?: number;
		user_id: number;
		first_name: string;
		last_name?: string;
		profile_photo?: string;
		premium?: number;
		anonymous_profile: [number, string, string];
		language: string;
	};

	participants: {
		id?: number;
		user_id: number;
		contest_id: number;
		submission: string;
	};
};
