export type BoolInt = 0 | 1;

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
	title: string;
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
		public: BoolInt;
		anonymous: BoolInt;
		verified?: BoolInt;
		announced?: BoolInt;
		category?: string;
		image?: string;
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
		premium?: BoolInt;
		anonymous_profile: [number, string, string];
		language: string;
		created_at?: string;
	};

	submissions: {
		id?: number;
		user_id: number;
		contest_id: number;
		submission: string;
		likes?: number[];
		dislikes?: number[];
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
};
