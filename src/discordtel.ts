import { readdir } from "fs-nextra"
// const clear = require("clear-module");
import { createLogger, format, transports, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { BaseCluster } from "kurasuta";
import { settings } from "./configuration/config";
import { util } from "./constants/interfaces";

module.exports = class extends BaseCluster {
	public async launch(): Promise<void> {
		const logger: Logger = createLogger({
			level: "info",
			transports: [
				new transports.Console({
					format: format.colorize(),
				}),
				new DailyRotateFile({
					filename: `./Logs/Winston-Log-%DATE%-Shard${this.client.shard!.id}.log`,
					datePattern: "YYY-MM-DD-HH",
					zippedArchive: true,
					maxFiles: "100d",
					maxSize: "20m",
				}),
			],
			exitOnError: false,
			format: format.combine(
				format.colorize(),
				format.timestamp(),
				format.printf((info: any) => `${info.level}: [Shard ${this.client.shard!.id}] ${info.message} [${info.timestamp}]`)
				// format.simple(),
			),
		});

		let { databaseInterfaces } = await require("./Database/init")()
			.then(() => logger.info("[Database] Successfully connected to the database."))
			.catch((err: object) => logger.error(`[Database] An error occured while initializing the database.\n${err}`));

		const constants: util = {
			client: this.client,
			db: databaseInterfaces,
			logger,
		};

		let events: string[] = await readdir("./events");
		for (let e of events) {
			let name: string = e.replace(".js", "");
			this.client.on(name, async(...args: any) => {
				(req => req.default || req)(require(`./Events/${e}`))(constants, ...args)
			});
		}

		this.client.on("disconnect", () => this.client.login());

		// Scheduled jobs
		// require("./Internals/jobs.js");

		if (settings.devMode) process.on("unhandledRejection", (e: any) => logger.error(e));

		this.client.login(require("./Configuration/auth.js").discord.token).catch(() => {
			let interval = setInterval(() => {
				this.client.login(require("./Configuration/auth.js").discord.token)
					.then(() => {
						clearInterval(interval);
					})
					.catch(() => {
						logger.info("[Discord] Failed to connect. Retrying in 5 minutes...");
					});
			}, 300000);
		});
	}
};