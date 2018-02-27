const MessageBuilder = require("../modules/MessageBuilder");

module.exports = async(client, msg, suffix) => {
	let perms = await client.permCheck(msg.author.id);
	if (!perms.boss) return;
	if (!suffix) return msg.reply("<:bloblul:356789385875816448> **You forgot a parameter!**");
	let allNumbers = await Numbers.find({});
	for (let n of allNumbers) {
		let channel = await client.api.channels(n._id).get();
		if (channel) {
			try {
				await client.apiSend(suffix, n._id);
			} catch (error) {
				console.log(error);
			}
		}
	}
	msg.reply("✅ Your message has been successfully globally announced.");
};
