import type { DB } from "./db.d.ts";

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

export type DBSchema = DB;
