const { Structures } = require("discord.js");

module.exports = () => {
	Structures.extend("User", User => {
		class DTelUser extends User {
			get account() {
				return (async() => {
					let account = await r.table("Accounts").get(this.id);
					if (!account) {
						account = { id: this.id, balance: 0 };
						await r.table("Accounts").insert(account);
						this.send({ embed: { color: config.colors.info, title: "Account created", description: `We just made an account for you! Please read [this information](${config.paymentLink}) on payment.` } }).catch(e => null);
					}
					return account;
				})();
			}

			get blacklisted() {
				return !!r.table("Blacklist").get(this.id);
			}

			async getPerms() {
				let toRet = {
					boss: false,
					manager: false,
					support: false,
					donator: false,
				};
				return this.client.api.guilds(config.supportGuild).members(this.id).get()
					.then(member => {
						if (config.maintainers.includes(this.id)) toRet = { boss: true, manager: true, support: true, donator: true };
						if (member.roles.includes(config.bossRole)) toRet.boss = true;
						if (member.roles.includes(config.managerRole)) toRet.manager = true;
						if (member.roles.includes(config.supportRole)) toRet.support = true;
						if (member.roles.includes(config.donatorRole)) toRet.donator = true;
						return toRet;
					})
					.catch(() => toRet);
			}
		}
		return DTelUser;
	});
};
