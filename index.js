const { Client, Collection, Intents, MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require("discord.js")
const config = require("./JSON/config.json")
const Enmap = require("enmap");
const client = new Client({

    partials: ["CHANNEL", "MESSAGE", "GUILD_MEMBER", "REACTION"],
    intents: [
        Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_PRESENCES,
    ],
    allowedMentions: { parse: ["users", "roles"], repliedUser: true }
})
console.clear()


module.exports.client = client
client.commands = new Collection();
client.aliases = new Collection();
client.SlashCmds = new Collection();


['command', 'events'].forEach(handler => {
    require(`./handlers/${handler}`)(client);
})



client.login(config.env.token)