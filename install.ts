import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./utils/env";

const SERVICE_NAME = `bot-${env.BOT_USERNAME}`;
const description = `${env.BOT_USERNAME} service`;

const indexPath = resolve("./index.ts");

const workingDirectory = resolve(".");

const serviceContent = `
[Unit]
Description=${description}
After=network.target

[Service]
ExecStart=/usr/bin/env /root/.bun/bin/bun ${indexPath}
Restart=always
RestartSec=3
WorkingDirectory=${workingDirectory}
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal
User=${process.env.SUDO_USER || process.env.USER || "bun"}
# Adjust this if you need to set a group
# Group=${process.env.USER}

[Install]
WantedBy=multi-user.target
`.trim();

const serviceFilePath = `/etc/systemd/system/${SERVICE_NAME}.service`;

try {
	console.log(`📝 Writing systemd service to: ${serviceFilePath}`);
	writeFileSync(serviceFilePath, serviceContent);

	console.log("🔄 Reloading systemd daemon...");
	execSync("systemctl daemon-reexec");
	execSync("systemctl daemon-reload");

	console.log(`✅ Enabling ${SERVICE_NAME} service...`);
	execSync(`systemctl enable ${SERVICE_NAME}`);

	console.log(`🚀 Starting ${SERVICE_NAME} service...`);
	execSync(`systemctl restart ${SERVICE_NAME}`);

	console.log(`🎉 Service '${SERVICE_NAME}' is installed and running!`);
} catch (err) {
	console.error("❌ Failed to install systemd service:", err);
}
