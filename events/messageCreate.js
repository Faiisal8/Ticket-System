const client = require("../index").client
const config = require("../JSON/config.json")
const prefix = config.env.prefix
let cooldown = new Set();
let cdseconds = 5;

client.on("messageCreate", async message => {
    if(!config.env.owners.includes(message.author.id)) return
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    if (cooldown.has(message.author.id)) {

        return message.channel.send(`**${message.author.username}** wait \`3\` seconds to use this command!`)
    }
    cooldown.add(message.author.id);
    setTimeout(() => {
        cooldown.delete(message.author.id)
    }, cdseconds * 1000)

    if (!message.member)
        message.member = message.guild.fetchMember(message);

    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd.length === 0) return;

    let command = client.commands.get(cmd);

    if (!command) command = client.commands.get(client.aliases.get(cmd));

    if (command) command.run(client, message, args);
});