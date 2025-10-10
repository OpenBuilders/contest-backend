import { Address, Cell, contractAddress, loadStateInit } from "@ton/core";
import { MD5 } from "bun";
import sha256 from "fast-sha256";
import { sign } from "tweetnacl";
import { tonClient } from "./ton";

export const generateUserIDHash = (user_id: number) => {
	let encode = 0;
	for (let i = 0; i < user_id.toString().length; i++) {
		encode =
			(encode ^ user_id.toString().charCodeAt(i)) + ((encode << 5) - encode);
		encode |= 0;
	}
	return MD5.hash((encode >>> 0).toString(16), "hex");
};

export type TonProofItemReplySuccess = {
	name: "ton_proof";
	proof: {
		timestamp: number | string;
		domain: {
			lengthBytes: number;
			value: string;
		};
		signature: string;
		payload: string;
	};
};

const tonProofPrefix = "ton-proof-item-v2/";
const tonConnectPrefix = "ton-connect";

export const verifyTonProof = async (
	wallet_address: string,
	proof: TonProofItemReplySuccess["proof"] | undefined,
	walletStateInit: string,
) => {
	if (!proof) return false;

	try {
		const address = Address.parse(wallet_address);
		const result = await tonClient.runMethod(address, "get_public_key", []);

		const public_key = Buffer.from(
			result.stack.readBigNumber().toString(16).padStart(64, "0"),
			"hex",
		);

		const { signature, timestamp, domain, payload } = proof;

		const stateInit = loadStateInit(
			Cell.fromBase64(walletStateInit).beginParse(),
		);

		const contractAddr = contractAddress(address.workChain, stateInit);

		if (!contractAddr.equals(address)) {
			return false;
		}

		const message = {
			workchain: address.workChain,
			address: address.hash,
			domain: {
				lengthBytes: domain.lengthBytes,
				value: domain.value,
			},
			signature: Buffer.from(signature, "base64"),
			payload: payload,
			stateInit: walletStateInit,
			timestamp: timestamp,
		};

		const wc = Buffer.alloc(4);
		wc.writeUInt32BE(message.workchain, 0);

		const ts = Buffer.alloc(8);
		ts.writeBigUInt64LE(BigInt(message.timestamp), 0);

		const dl = Buffer.alloc(4);
		dl.writeUInt32LE(message.domain.lengthBytes, 0);

		const msg = Buffer.concat([
			Buffer.from(tonProofPrefix),
			wc,
			message.address,
			dl,
			Buffer.from(message.domain.value),
			ts,
			Buffer.from(message.payload),
		]);

		const msgHash = Buffer.from(sha256(msg));

		// signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("ton-connect") ++ sha256(message)))
		const fullMsg = Buffer.concat([
			Buffer.from([0xff, 0xff]),
			Buffer.from(tonConnectPrefix),
			msgHash,
		]);

		const msgBuffer = Buffer.from(sha256(fullMsg));

		return sign.detached.verify(msgBuffer, message.signature, public_key);
	} catch (e) {
		console.error(e);
	}

	return false;
};
