import { readFile, writeFile } from "node:fs/promises";
import {
	type BotPipeline,
	getFile,
	NyxResponse,
	sendMessage,
} from "nyx-bot-client";
import z from "zod";
import { generateRandomHash } from "../../../../helpers/string";
import { limits } from "../../../../information/limits";
import type { DBSchema } from "../../../../schema";
import { db } from "../../../../utils/database";
import { encodeEntitiesToHTML } from "../../../../utils/entity";
import { events } from "../../../../utils/events";
import { t } from "../../../../utils/i18n";
import { normalizeImageToWebP } from "../../../../utils/image";
import { getState, setState } from "../../../../utils/state";

export const handlerPrivateStateCreate: BotPipeline<
	"message",
	DBSchema
> = async (message, injections) => {
	const { state } = await getState(message.chat.id, "private");

	if (state === "create") {
		for (const handler of pipelines) {
			const result = await handler(message, injections);

			if (result === NyxResponse.Finish) {
				return NyxResponse.Finish;
			}
		}
	}

	return NyxResponse.Ok;
};

const handlerPrivateStateCreateTitle: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	const { state, params } = await getState(message.chat.id, "private");

	if (params.step === "title") {
		const validate = z.safeParse(
			z
				.string()
				.min(limits.form.create.title.minLength)
				.max(limits.form.create.title.maxLength),
			message.text ?? "",
		);

		if (validate.success) {
			const { data: title } = validate;

			params.step = "description";
			params.title = title;

			setState(message.chat.id, "private", {
				state,
				params,
			});

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.description.text", {
					title: title,
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.title.invalid", {
					min: limits.form.create.title.minLength.toString(),
					max: limits.form.create.title.maxLength.toString(),
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};

const handlerPrivateStateCreateDescription: BotPipeline<
	"message",
	DBSchema
> = async (message) => {
	const { state, params } = await getState(message.chat.id, "private");

	if (params.step === "description") {
		const validate = z.safeParse(
			z.string().min(1).max(limits.form.create.description.maxLength),
			encodeEntitiesToHTML(message.text ?? "", message.entities ?? []),
		);

		if (validate.success) {
			const { data: description } = validate;

			params.step = "photo";
			params.description = description;

			setState(message.chat.id, "private", {
				state,
				params,
			});

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.photo.text"),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.description.invalid", {
					max: limits.form.create.description.maxLength.toString(),
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};

const handlerPrivateStateCreatePhoto: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	const { state, params } = await getState(message.chat.id, "private");

	if (params.step === "photo") {
		const photo = message.photo?.at(-1);

		if (photo && photo.width === photo.height) {
			params.step = "date";
			params.photo = photo.file_id;

			setState(message.chat.id, "private", {
				state,
				params,
			});

			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.date.text"),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.photo.invalid"),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};

const handlerPrivateStateCreateDate: BotPipeline<"message", DBSchema> = async (
	message,
) => {
	const { params } = await getState(message.chat.id, "private");

	if (params.step === "date") {
		const validate = z.safeParse(
			z.coerce.number().min(1).max(90),
			message.text ?? "",
		);

		if (validate.success) {
			const { data: days } = validate;

			const slug = generateRandomHash();
			const slug_moderator = generateRandomHash();

			const value: DBSchema["contests"] = {
				slug,
				slug_moderator,
				title: params.title,
				description: params.description ?? "",
				prize: params.prize,
				owner_id: message.chat.id,
				date_end: Math.ceil(Date.now() / 1000) + days * 86400,
				anonymous: 0,
				fee: 0,
			};

			if (params.photo) {
				const file = await getFile({
					file_id: params.photo,
				});

				if (file.ok) {
					const fileId = generateRandomHash();

					const image = await normalizeImageToWebP(
						await readFile(file.result.file_path!),
						256,
						256,
					);

					if (image) {
						await writeFile(
							`${__dirname}/../../../../storage/images/${fileId}`,
							image,
						);

						value.image = fileId;
					}
				}
			}

			await db.insertInto("contests").values(value).execute();

			const contest = await db
				.selectFrom("contests")
				.selectAll()
				.where("slug", "=", slug)
				.executeTakeFirst();

			events.emit("contestCreated", {
				contest_id: contest!.id!,
				user_id: message.chat.id,
				notify: true,
			});

			setState(message.chat.id, "private", {});
		} else {
			sendMessage({
				chat_id: message.chat.id,
				text: t("en", "general.create.date.invalid", {
					min: "0",
					max: "90",
				}),
				reply_parameters: {
					message_id: message.message_id,
					allow_sending_without_reply: true,
				},
			});
		}

		return NyxResponse.Finish;
	}

	return NyxResponse.Ok;
};

const pipelines: BotPipeline<"message", DBSchema>[] = [
	handlerPrivateStateCreateTitle,
	handlerPrivateStateCreateDescription,
	handlerPrivateStateCreatePhoto,
	handlerPrivateStateCreateDate,
];
