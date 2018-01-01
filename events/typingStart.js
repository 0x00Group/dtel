module.exports = async(bot, channel, member) => {
	let callTo, callFrom;
	try {
		callTo = await Calls.findOne({ to: { channelID: channel.id } });
	} catch (err) {
		try {
			callFrom = await Calls.findOne({ from: { channelID: channel.id } });
		} catch (err2) {
			return null;
		}
	}
	if (callTo) {
		bot.channels.get(callTo.from.channelID).startTyping(100);
	} else if (callFrom) {
		bot.channels.get(callFrom.to.channelID).startTyping(100);
	}
};
