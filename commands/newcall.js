const uuidv1 = require("uuid/v1");

module.exports = async(bot, message, args) => {
	let mynumber;
	try {
		mynumber = await Numbers.findOne({ _id: message.channel.id });
	} catch (err) {
		message.guild.channels.forEach(async c => {
			let activeChannel, numberError;
			try {
				activeChannel = await Numbers.findOne({ _id: c.id });
			} catch (err2) {
				numberError = err2;
				return;
			}
			if (!numberError && activeChannel) {
				return message.reply(`:x: Dialing error: There's no number associated with this channel. Please dial from a channel that has DiscordTel service, such as <#${activeChannel._id}>.`);
			} else {
				return message.reply(":x: Dialing error: There's no number associated with this channel. Please dial from a channel that has DiscordTel service. Create a number in any channel by typing `>wizard`. \nIf you need assistance or have any questions, call `*611`.");
			}
		});
	}
	let toDial = args;
	if (toDial) {
		if (toDial && toDial.trim().toLowerCase() === "*rom") toDial = "03015050505";
		if (toDial === mynumber.number) return message.reply(":thinking: Why are you trying to call yourself?");
		if (toDial === "*611") {
			if (message.guild.id === "281815661317980160") {
				message.reply(":x: You are unable to call *611 here because Customer Support is literally at your doorstep.");
			} else {
				toDial = "08006113835";
			}
		}
		if (toDial === "*411") {
			message.reply("Welcome to DiscordTel 411.\nFor **checking an existing __11-digit__ number**, press `1`.\nFor **searching the yellowbook by query**, press `2`.\nFor **adding/editing/removing number registry**, press `3`.\nTo talk to a Customer Support, press `0` then dial `*611`.\nTo exit 411 service, press `0`.");
			// open collector and do things
		}
		if (toDial === "*233") {
			let account;
			try {
				account = await Accounts.findOne({ _id: message.author.id });
			} catch (err) {
				if (err && !account) {
					await Accounts.create(new Accounts({ _id: message.author.id, balance: 0 }), account);
					message.reply("You don't have an account created... Creating an account for you! Please also read for information on payment: <http://discordtel.readthedocs.io/en/latest/Payment/>");
					// await Accounts.findOne({ _id: message.author.id });
				}
			}
			if (account.balance < 500) {
				return message.channel.send({
					embed: {
						title: "Current Number Status",
						description: "You have less than 500 credits which means you cannot renew your number.",
						fields: [{
							name: "Number",
							value: mynumber.number,
						},
						{
							name: "Expiration",
							value: `${mynumber.year}/${mynumber.month}`,
						},
						{
							name: "Your Balance",
							value: account.balance,
						},
						{
							name: "How to recharge",
							value: "http://discordtel.austinhuang.me/en/latest/Payment/",
						}],
					},
				});
			} else if (!mynumber) {
				return message.channel.send({
					embed: {
						color: 3447003,
						title: "Current Account Status",
						fields: [{
							name: "Your Balance",
							value: account.balance,
						},
						{
							name: "How to recharge",
							value: "http://discordtel.austinhuang.me/en/latest/Payment/",
						}],
					},
				});
			} else {
				message.channel.send({
					embed: {
						color: 3447003,
						title: "Current Number Status",
						description: "Type the amount of months you want to renew your number.",
						fields: [{
							name: "Number",
							value: mynumber.number,
						},
						{
							name: "Expiration",
							value: `${mynumber.year}/${mynumber.month}`,
						},
						{
							name: "Your Balance",
							value: account.balance,
						},
						{
							name: "How to recharge",
							value: "http://discordtel.austinhuang.me/en/latest/Payment/",
						}],
						footer: {
							text: "To hang up, press `0`.",
						},
					},
				});
				// message collector and stuff
			}
		}
		toDial = toDial.replace(/(a|b|c)/ig, "2")
			.replace(/(d|e|f)/ig, "3")
			.replace(/(g|h|i)/ig, "4")
			.replace(/(j|k|l)/ig, "5")
			.replace(/(m|n|o)/ig, "6")
			.replace(/(p|q|r|s)/ig, "7")
			.replace(/(t|u|v)/ig, "8")
			.replace(/(w|x|y|z)/ig, "9")
			.replace(/-/ig, "")
			.replace("(", "")
			.replace(")", "")
			.replace(" ", "");
		let toDialDocument;
		try {
			toDialDocument = await Numbers.findOne({ number: toDial });
		} catch (err) {
			return message.reply(":x: Dialing error: Requested number does not exist. Call `*411` to check numbers.");
		}
		if (toDialDocument.year < new Date().getFullYear() || toDialDocument.year === new Date().getFullYear() && toDialDocument.month <= new Date().getMonth()) {
			return message.reply(":x: Dialing error: The number you have dialled has expired. Please contact the number owner to renew it.");
		}
		if (mynumber.year < new Date().getFullYear() || mynumber.year === new Date().getFullYear() && mynumber.month <= new Date().getMonth()) {
			return message.reply(":x: Billing error: Your number has expired. You can renew your number by dialling `*233`.");
		}
		if (!bot.channels.get(toDialDocument._id)) {
			return message.reply(":x: Dialing error: Number is unavailable to dial. It could be deleted, hidden from the bot, or it left the corresponding server. Please dial `*611` for further instructions.");
		}
		let dialedInCall;
		try {
			dialedInCall = await Calls.findOne({ to: { channelID: toDialDocument._id } });
		} catch (err) {
			try {
				dialedInCall = await Calls.findOne({ from: { channelID: toDialDocument._id } });
			} catch (err2) {
				return null;
			}
		}
		if (dialedInCall) {
			return message.reply(":x: Dialing error: The number you dialed is already in a call.");
		}
		if (toDial === "08006113835") {
			bot.channels.get(toDialDocument._id).send("<@&281815839936741377>");
		}
		// Error checking and utils finished! Let's actually start calling.
		message.reply(`:telephone: Dialling ${toDial}... You are able to \`>hangup\`.`);
		bot.channels.get("282253502779228160").send(`:telephone: A **normal** call is established between channel ${message.channel.id} and channel ${toDialDocument._id} by __${message.author.tag}__ (${message.author.id}).`);
		await Calls.create(
			new Calls({
				_id: uuidv1(),
				to: {
					channelID: toDialDocument._id,
					number: toDialDocument.number,
				},
				from: {
					channelID: message.channel.id,
					number: mynumber.number,
				},
			}), callDocument => {
				bot.channels.get(toDialDocument._id).send(`There is an incoming call from \`(${mynumber.number}\`. You can either type \`>pickup\` or \`>hangup\`, or wait it out.`);
				setTimeout(async() => {
					callDocument.status = false;
					await callDocument.save();
					message.reply(":negative_squared_cross_mark: This call has expired (2 minutes).");
					bot.channels.get(callDocument.to.channelID).send(":x: This call has expired (2 minutes).");
					bot.channels.get("282253502779228160").send(`:telephone: The call between channel ${callDocument.from.channelID} and channel ${callDocument.to.channel} has expired.`);
					let mailbox;
					try {
						mailbox = await Mailbox.findOne({ _id: toDialDocument._id });
					} catch (err) {
						return bot.channels.get(callDocument.from.channelID).send(":x: Call ended; their mailbox isn't setup");
					}
					bot.channels.get(callDocument.from.channelID).send(`:x: ${mailbox.settings.autoreply}`);
					bot.channels.get(callDocument.from.channelID).send(":question: Would you like to leave a message? `>message [number] [message]`");
				}, 120000);
			}
		);
	}
};