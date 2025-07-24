import sharp from "sharp";

export async function normalizeImageToWebP(
	inputBuffer: Buffer,
	width: number,
	height: number,
	quality = 80,
): Promise<Buffer | null> {
	try {
		return await sharp(inputBuffer, { failOnError: false })
			.resize(width, height, {
				fit: "cover",
				position: "center",
			})
			.webp({ quality })
			.toBuffer();
	} catch (err) {
		console.error("Failed to process image:", err);
		return null;
	}
}
