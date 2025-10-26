import { Address } from "@ton/core";
import type { Handler } from "elysia";
import { env } from "../../utils/env";

type Invoice = {
	amount: string;
	tx_hash: string;
	currency: string;
	payload: string;
	sender: string;
	amountParsed?: number;
	raw?: string;
};

export const invoices: Invoice[] = [];

export const routePOSTInvoiceWebhook: Handler = async (ctx) => {
	console.log("DEBUG_TRANSACTION", "CTX", ctx, new Date().toLocaleTimeString());

	if (
		env.INVOICE_WEBHOOK_SECRET === undefined ||
		ctx.headers["x-invoice-api-secret-token"] === env.INVOICE_WEBHOOK_SECRET
	) {
		const invoice = JSON.parse(
			await new Response(ctx.request.body).text(),
		) as Invoice;

		console.log(
			"DEBUG_TRANSACTION",
			"INVOICE",
			invoice,
			new Date().toLocaleTimeString(),
		);

		if (invoice.currency === "TON") {
			const address = Address.parse(invoice.sender);
			invoice.raw = address.toRawString();
			invoice.amountParsed =
				Number.parseInt(invoice.amount, 10) / 1_000_000_000;

			console.log(
				"DEBUG_TRANSACTION",
				"INVOICE_TRANSFORMED",
				invoice,
				new Date().toLocaleTimeString(),
			);

			invoices.push(invoice);
		}

		console.log(
			"DEBUG_TRANSACTION",
			"INVOICES",
			invoices,
			new Date().toLocaleTimeString(),
		);

		return {
			status: "success",
		};
	}

	return {
		status: "failed",
		result: "invalid webhook secret",
	};
};
