export type Placement = {
	id: number;
	name: string;
	prize?: string;
	submissions: number[];
};

export type GallerySliderItem = {
	image: string;
	url: string;
};

export type GallerySlider = {
	type: "slider";
	id: string;
	items_per_view?: number;
	items: GallerySliderItem[];
};

export type GallerySection = {
	type: "section";
	id: string;
	title?: string;
	items: any[];
};

export type GalleryItem = GallerySlider | GallerySection;

export type DBSchema = {
	contests: {
		id?: number;
		slug: string;
		slug_moderator: string;
		owner_id: number;
		moderators?: number[];
		title: string;
		description: string;
		instruction?: string;
		fee: number;
		fee_wallet?: string;
		prize?: string;
		anonymous: boolean;
		verified?: boolean;
		announced?: boolean;
		image?: string;
		cover_image?: {
			file_id: string;
			metadata: {
				title: string;
				image?: string;
				theme?: {
					backdrop?: number;
					symbol?: string;
				};
			};
		};
		theme?: {
			backdrop?: number;
			symbol?: string;
		};
		results?: Placement[];
		date_end: number;
		created_at?: string;
	};

	users: {
		id?: number;
		user_id: number;
		first_name: string;
		last_name?: string;
		username?: string;
		profile_photo?: string;
		premium?: boolean;
		anonymous_profile: [number, string, string] | string[][];
		language: string;
		created_at?: string;
	};

	submissions: {
		id?: number;
		user_id: number;
		contest_id: number;
		submission: object;
		created_at?: string;
	};

	votes: {
		id?: number;
		user_id: number;
		submission_id: number;
		vote: number;
		created_at?: string;
	};

	bookmarks: {
		id?: number;
		user_id: number;
		contest_id: number;
		created_at?: string;
	};

	moderators: {
		id?: number;
		user_id: number;
		contest_id: number;
		created_at?: string;
	};

	settings: {
		id?: number;
		meta: string;
		value: string;
	};
};
