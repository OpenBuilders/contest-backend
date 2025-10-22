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
	if (
		env.INVOICE_WEBHOOK_SECRET === undefined ||
		ctx.headers["x-invoice-api-secret-token"] === env.INVOICE_WEBHOOK_SECRET
	) {
		const invoice = JSON.parse(
			await new Response(ctx.request.body).text(),
		) as Invoice;

		if (invoice.currency === "TON") {
			const address = Address.parse(invoice.sender);
			invoice.raw = address.toRawString();
			invoice.amountParsed =
				Number.parseInt(invoice.amount, 10) / 1_000_000_000;

			invoices.push(invoice);
		}

		return {
			status: "success",
		};
	}

	return {
		status: "failed",
		result: "invalid webhook secret",
	};
};
