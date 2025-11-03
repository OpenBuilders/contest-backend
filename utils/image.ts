import sharp from "sharp";
import { logger } from "./logger";

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
	} catch (e) {
		logger.error(
			"normalizeImageToWebP",
			e instanceof Error ? e.message : String(e),
		);
		return null;
	}
}
