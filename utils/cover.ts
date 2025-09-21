import fs from "node:fs/promises";
import os from "node:os";
import { createCanvas, loadImage, registerFont } from "canvas";
import { sendPhoto } from "nyx-bot-client";
import sharp from "sharp";
import { generateRandomHash } from "../helpers/string";
import type { DBSchema } from "../schema";
import { db } from "./database";
import { env } from "./env";
import { type ContestThemeBackdrop, ContestThemeBackdrops } from "./themes";

const fonts = [
	{
		family: "Inter-Black",
		filename: "Inter-Black.otf",
	},
	{
		family: "Inter-Bold",
		filename: "Inter-Bold.otf",
	},
	{
		family: "Inter-ExtraBold",
		filename: "Inter-ExtraBold.otf",
	},
	{
		family: "Inter-Italic",
		filename: "Inter-Italic.otf",
	},
	{
		family: "Inter-Medium",
		filename: "Inter-Medium.otf",
	},
	{
		family: "Inter-Regular",
		filename: "Inter-Regular.otf",
	},
	{
		family: "Inter-SemiBold",
		filename: "Inter-SemiBold.otf",
	},
	{
		family: "Vazirmatn-Black",
		filename: "Vazirmatn-Black.ttf",
	},
	{
		family: "Vazirmatn-Bold",
		filename: "Vazirmatn-Bold.ttf",
	},
	{
		family: "Vazirmatn-ExtraBold",
		filename: "Vazirmatn-ExtraBold.ttf",
	},
	{
		family: "Vazirmatn-ExtraLight",
		filename: "Vazirmatn-ExtraLight.ttf",
	},
	{
		family: "Vazirmatn-Light",
		filename: "Vazirmatn-Light.ttf",
	},
	{
		family: "Vazirmatn-Medium",
		filename: "Vazirmatn-Medium.ttf",
	},
	{
		family: "Vazirmatn-Regular",
		filename: "Vazirmatn-Regular.ttf",
	},
	{
		family: "Vazirmatn-SemiBold",
		filename: "Vazirmatn-SemiBold.ttf",
	},
	{
		family: "Vazirmatn-Thin",
		filename: "Vazirmatn-Thin.ttf",
	},
];

for (const font of fonts) {
	registerFont(`${__dirname}/../storage/fonts/${font.filename}`, {
		family: font.family,
	});
}

export async function generateContestCoverImage(
	title: string,
	backdrop: ContestThemeBackdrop | undefined,
	symbol: string | undefined = undefined,
	image: string | undefined = undefined,
) {
	const canvas = createCanvas(1080, 640);
	const ctx = canvas.getContext("2d");

	const { width, height } = canvas;
	const imageSize = Math.min(width, height) / 2.5;

	const gradient = ctx.createRadialGradient(
		width / 2,
		height / 2,
		0,
		width / 2,
		height / 2,
		Math.max(width, height) / 2,
	);

	const theme: { backdrop: ContestThemeBackdrop; symbol: string } = {
		backdrop: backdrop ?? {
			id: -1,
			name: "default",
			colors: {
				center: "#0fbbf4",
				edge: "#2a92e0",
				pattern: "#ffffff",
				text: "#ffffff",
			},
		},
		symbol: symbol ?? "symbol-55",
	};

	gradient.addColorStop(0, theme.backdrop.colors.center);
	gradient.addColorStop(1, theme.backdrop.colors.edge);

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	const symbolString = (
		await fs.readFile(`${__dirname}/../storage/symbols/${theme.symbol}.svg`)
	)
		.toString()
		.replace(
			/viewBox="[^"]*?(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/,
			(m, w, h) => `${m} width="${w}" height="${h}"`,
		);

	const symbolImageColored = await loadImage(
		Buffer.from(
			symbolString.replace(
				/fill="[^"]*"/g,
				`fill="${theme.backdrop.colors.pattern}"`,
			),
		),
	);
	const symbolImageWhite = await loadImage(
		Buffer.from(symbolString.replace(/fill="[^"]*"/g, `fill="#ffffff"`)),
	);

	const pointOnCircle = (
		cx: number,
		cy: number,
		r: number,
		degrees: number,
	) => {
		const radians = degrees * (Math.PI / 180);
		const x = cx + r * Math.cos(radians);
		const y = cy + r * Math.sin(radians);
		return { x, y };
	};

	const layers = [
		{
			count: 6,
			alpha: 0.325,
			distance: height / 3.5,
			size: height / 12,
		},
		{
			count: 9,
			alpha: 0.125,
			distance: height / 2,
			size: height / 15,
		},
		{
			count: 14,
			alpha: 0.0625,
			distance: height / 1.5,
			size: height / 18,
		},
	];

	for (const layer of layers) {
		const { size, alpha, count, distance } = layer;
		const dpi = 1;

		for (let i = 0; i < count; i++) {
			const { x, y } = pointOnCircle(
				canvas.width / 2,
				canvas.height / 2,
				distance * dpi,
				i * (360 / count),
			);

			ctx.globalAlpha = alpha;
			ctx.drawImage(
				symbolImageColored,
				x - (size * dpi) / 2,
				y - (size * dpi) / 2,
				size * dpi,
				size * dpi,
			);
		}
	}

	ctx.globalAlpha = 1;

	if (image) {
		const imageFile = await loadImage(
			await sharp(await fs.readFile(`${__dirname}/../storage/images/${image}`))
				.png()
				.toBuffer(),
		);

		const x = (width - imageSize) / 2;
		const y = (height - imageSize) / 2;
		const radius = 32;

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + imageSize - radius, y);
		ctx.quadraticCurveTo(x + imageSize, y, x + imageSize, y + radius);
		ctx.lineTo(x + imageSize, y + imageSize - radius);
		ctx.quadraticCurveTo(
			x + imageSize,
			y + imageSize,
			x + imageSize - radius,
			y + imageSize,
		);
		ctx.lineTo(x + radius, y + imageSize);
		ctx.quadraticCurveTo(x, y + imageSize, x, y + imageSize - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();

		ctx.save();
		ctx.clip();

		ctx.drawImage(imageFile, x, y, imageSize, imageSize);
		ctx.restore();
	} else {
		ctx.drawImage(
			symbolImageWhite,
			(width - imageSize) / 2,
			(height - imageSize) / 2,
			imageSize,
			imageSize,
		);
	}

	ctx.font = `${Math.max(width, height) / 18}px Inter-SemiBold, Vazirmatn-Medium`;
	const measure = ctx.measureText(title);

	ctx.fillStyle = "white";
	ctx.fillText(title, (width - measure.width) / 2, height - height / 8);

	const buff = await sharp(canvas.toBuffer())
		.png({
			quality: 98,
		})
		.toBuffer();

	const filename = generateRandomHash();

	const filepath = `${os.tmpdir()}/${filename}`;

	await fs.writeFile(filepath, buff);

	return filepath;
}

export async function cacheContestCoverImage(
	contest: Pick<
		DBSchema["contests"],
		"id" | "title" | "image" | "theme" | "cover_image"
	>,
) {
	const { id, title, image, theme, cover_image } = contest;
	const theme_parsed = JSON.parse((theme ?? "{}") as any);

	const metadata = {
		title,
		image,
		theme: theme_parsed,
	};

	const cover_image_parsed = JSON.parse((cover_image ?? "{}") as any);
	if (JSON.stringify(cover_image_parsed?.metadata) === JSON.stringify(metadata))
		return;

	const file_path = await generateContestCoverImage(
		title,
		ContestThemeBackdrops.find((i) => i.id === (theme_parsed.backdrop ?? -1)),
		theme_parsed.symbol,
		image,
	);

	const result = await sendPhoto({
		chat_id: env.COVER_ARCHIVE_CHAT_ID,
		photo: `file://${file_path}`,
	});

	if (result.ok) {
		const new_cover_image = {
			file_id: result.result.photo?.at(-1)?.file_id,
			metadata,
		};

		await db
			.updateTable("contests")
			.set({
				cover_image: JSON.stringify(new_cover_image) as any,
			})
			.where("id", "=", id)
			.execute();

		return new_cover_image;
	}
}
