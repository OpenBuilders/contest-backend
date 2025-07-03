import { execSync } from "node:child_process";
import { env } from "./env";

export const reload = () => {
	execSync(`systemctl restart bot-${env.BOT_USERNAME}.service`);
};
