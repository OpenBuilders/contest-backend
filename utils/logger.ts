import fs from "node:fs/promises";
import { join } from "node:path";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export class Logger {
	private filePath: string;
	private console: boolean;

	constructor(fileName: string = "app.log", console?: boolean) {
		this.filePath = join(import.meta.dir, "../", fileName);
		this.console = console ?? false;
	}

	private formatMessage(
		level: LogLevel,
		context: string,
		message: string,
	): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${level}] [${context}] ${message}\n`;
	}

	log(context: string, message: string) {
		const log = this.formatMessage("INFO", context, message);
		if (this.console) {
			console.log(log);
		}
		return fs.appendFile(this.filePath, log);
	}

	info(context: string, message: string) {
		const log = this.formatMessage("INFO", context, message);
		if (this.console) {
			console.log(log);
		}
		return fs.appendFile(this.filePath, log);
	}

	warn(context: string, message: string) {
		const log = this.formatMessage("WARN", context, message);
		if (this.console) {
			console.warn(log);
		}
		return fs.appendFile(this.filePath, log);
	}

	error(context: string, message: string) {
		const log = this.formatMessage("ERROR", context, message);
		if (this.console) {
			console.error(log);
		}
		return fs.appendFile(this.filePath, log);
	}
}

export const logger = new Logger("app.log", true);
