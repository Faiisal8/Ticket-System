const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js")
const config = require("../../JSON/config.json")

module.exports = {

    name: "ping",
    run: async (client, message, args) => {
        message.channel.send({ content: `Pong!` })
    }
}