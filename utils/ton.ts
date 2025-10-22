import { Address, beginCell, Cell, storeMessage, TonClient } from "@ton/ton";
import { env } from "./env";

export const tonClient = new TonClient({
	endpoint: env.TON_CLIENT_ENDPOINT_URL,
	apiKey: env.TON_CLIENT_API_KEY,
});

export const verifyTransaction = async (
	bocBase64: string,
	wallet_address: string,
) => {
	const cell = Cell.fromBase64(bocBase64);
	const address = Address.parse(wallet_address);
	const messageHash = cell.hash().toString("hex");

	const transactions = await tonClient.getTransactions(address, {
		limit: 10,
		archival: true,
	});

	const txs = transactions.map((tx) => {
		const hashes = [];
		hashes.push(tx.hash().toString("hex"));

		if (tx.inMessage) {
			const cell = beginCell().store(storeMessage(tx.inMessage)).endCell();
			hashes.push(cell.hash().toString("hex"));
			hashes.push(tx.inMessage.body.hash().toString("hex"))
		}

		for (const msg of tx.outMessages.values()) {
			const cell = beginCell().store(storeMessage(msg)).endCell();
			hashes.push(cell.hash().toString("hex"));
			hashes.push(msg.body.hash().toString("hex"));
		}

		return {
			tx,
			hashes,
		};
	});

	const tx = txs.find((i) => i.hashes.includes(messageHash));

	if (tx) {
		if (tx.tx.description.type === "generic") {
			if (tx.tx.description.computePhase.type === "vm") {
				return tx.tx.description.computePhase.success ?? false;
			}
		}
	}

	return false;
};
