const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js")
const config = require("../../JSON/config.json")
const db = require("../../models/TicketSchema")
const { createTranscript } = require("discord-html-transcripts")

module.exports = {

    name: "ticket",
    run: async (client, message, args) => {
        try {
            setTimeout(() => {
                message.delete()
            }, 500)
            const embed = new MessageEmbed()
                .setAuthor({ name: message.guild.name + "| Ticket System", iconURL: message.guild.iconURL({ dynamic: true }) })
                .setDescription("افتح تذكرة للشراء او الاستفسار")
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setColor("WHITE")
            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId("select")
                        .setPlaceholder("اختر نوع التذكرة للفتح")
                        .addOptions([
                            {
                                label: "شراء",
                                emoji: "💲",
                                description: "فتح تذكرة للشراء",
                                value: "buy"
                            },
                            {
                                label: "استفسار",
                                emoji: "❓",
                                description: "فتح تذكرة للاستفسار",
                                value: "quest"
                            }
                        ])
                )

            await message.guild.channels.cache.get(`${config.client.ticketChannel}`).send({
                embeds: [embed],
                components: [row]
            })

            let bt1 = new MessageButton()
                .setCustomId("close")
                .setLabel("Close")
                .setStyle("DANGER")

            let btn2 = new MessageButton()
                .setCustomId("lock")
                .setLabel("Lock")
                .setStyle("DANGER")

            let btn3 = new MessageButton()
                .setCustomId("unlock")
                .setLabel("UnLock")
                .setStyle("SUCCESS")


            const Buttons = new MessageActionRow()
                .addComponents(bt1, btn2, btn3)

            const collectord = message.channel.createMessageComponentCollector({
                componentType: "SELECT_MENU",
            })

            collectord.on("collect", async (collected) => {
                const value = collected.values[0]

                if (value === "buy") {
                    let ID = Math.floor(Math.random() * 1000) + 1000
                    await collected.guild.channels.create(`Buy-${ID}`, {
                        type: "GUILD_TEXT",
                        parent: config.client.category,
                        permissionOverwrites: [
                            {
                                id: collected.member.id,
                                allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
                            },
                            {
                                id: config.client.EveryoneID,
                                deny: ["SEND_MESSAGES", "VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
                            }
                        ]
                    }).then(async (channel) => {
                        await db.create({
                            MemberID: collected.member.id,
                            TicketID: ID,
                            ChannelID: channel.id,
                            Closed: false,
                            Locked: false,
                            Type: "buy"
                        })


                        const embed = new MessageEmbed()
                            .setAuthor({ name: `${collected.guild.name} | Ticket: ${ID}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                            .setDescription(`في انتظار الاداري...`)
                            .setColor("WHITE")

                        channel.send({ content: `<@${collected.member.id}>`, embeds: [embed], components: [Buttons] })


                        const collector = channel.createMessageComponentCollector({
                            componentType: "BUTTON"
                        })

                        collector.on("collect", async (i) => {
                            if (i.customId === "lock") {
                                if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                const embed = new MessageEmbed()
                                    .setColor("WHITE")

                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Locked == true) return i.reply({ content: `هاذي التذكرة مغلقه بالفعل`, ephemeral: true })
                                    await db.updateOne({ ChannelID: i.channel.id }, { Locked: true })
                                    embed.setDescription(`هاذي التذكرة الان مغلقه 🔒`)
                                    i.channel.permissionOverwrites.edit(data.MemberID, {
                                        SEND_MESSAGES: false
                                    })
                                    i.reply({ embeds: [embed], ephemeral: true })
                                })
                            }

                            if (i.customId === "unlock") {
                                if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                const embed = new MessageEmbed()
                                    .setColor("WHITE")

                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Locked == false) return i.reply({ content: `هاذي التذكرة مفتوحة بالفعل`, ephemeral: true })
                                    await db.updateOne({ ChannelID: i.channel.id }, { Locked: false })
                                    embed.setDescription(`هاذي التذكرة الان مفتوحه 🔓`)
                                    i.channel.permissionOverwrites.edit(data.MemberID, {
                                        SEND_MESSAGES: true
                                    })
                                    i.reply({ embeds: [embed], ephemeral: true })
                                })
                            }

                            if (i.customId === "close") {
                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Closed == true) return i.reply({ content: `التذكرة بالفعل مقفله الرجاء الانتظر الى ان تنحذف`, ephemeral: true })
                                    const attach = await createTranscript(i.channel, {
                                        limit: -1,
                                        returnBuffer: false,
                                        fileName: `${data.Type} - ${data.TicketID}.html`
                                    })
                                    const embed = new MessageEmbed()
                                        .setColor("WHITE")
                                    await db.updateOne({ ChannelID: i.channel.id }, { Closed: true })

                                    const member = client.users.cache.get(data.MemberID)
                                    const Message = await client.channels.cache.get(config.client.transcriptID).send({ embeds: [embed.setAuthor({ name: member.tag, iconURL: member.displayAvatarURL({ dynamic: true }) }).setTitle(`TransScript Type: ${data.Type}\nID: ${data.TicketID}`)], files: [attach] })

                                    await i.reply({ content: `التذكرة سوف تحذف بعد 10 ثواني` })
                                    setTimeout(async () => {
                                        i.channel.delete()
                                        await db.deleteOne({ ChannelID: i.channel.id })

                                    }, 10 * 1000)
                                })
                            }
                        })
                    })
                    collected.reply({ content: `Done Opened Ticket`, ephemeral: true })
                }

                if (value === "quest") {
                    let ID = Math.floor(Math.random() * 1000) + 1000
                    await collected.guild.channels.create(`question-${ID}`, {
                        type: "GUILD_TEXT",
                        parent: config.client.category,
                        permissionOverwrites: [
                            {
                                id: collected.member.id,
                                allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
                            },
                            {
                                id: config.client.EveryoneID,
                                deny: ["SEND_MESSAGES", "VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
                            }
                        ]
                    }).then(async (channel) => {
                        await db.create({
                            MemberID: collected.member.id,
                            TicketID: ID,
                            ChannelID: channel.id,
                            Closed: false,
                            Locked: false,
                            Type: "quest"
                        })


                        const embed = new MessageEmbed()
                            .setAuthor({ name: `${collected.guild.name} | Ticket: ${ID}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                            .setDescription(`في انتظار الاداري...`)
                            .setColor("WHITE")


                        channel.send({ content: `<@${collected.member.id}>`, embeds: [embed], components: [Buttons] })


                        const collector = channel.createMessageComponentCollector({
                            componentType: "BUTTON"
                        })

                        collector.on("collect", async (i) => {
                            if (i.customId === "lock") {
                                if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                const embed = new MessageEmbed()
                                    .setColor("WHITE")

                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Locked == true) return i.reply({ content: `هاذي التذكرة مغلقه بالفعل`, ephemeral: true })
                                    await db.updateOne({ ChannelID: i.channel.id }, { Locked: true })
                                    embed.setDescription(`هاذي التذكرة الان مغلقه 🔒`)
                                    i.channel.permissionOverwrites.edit(data.MemberID, {
                                        SEND_MESSAGES: false
                                    })
                                    i.reply({ embeds: [embed], ephemeral: true })
                                })
                            }

                            if (i.customId === "unlock") {
                                if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                const embed = new MessageEmbed()
                                    .setColor("WHITE")

                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Locked == false) return i.reply({ content: `هاذي التذكرة مفتوحة بالفعل`, ephemeral: true })
                                    await db.updateOne({ ChannelID: i.channel.id }, { Locked: false })
                                    embed.setDescription(`هاذي التذكرة الان مفتوحه 🔓`)
                                    i.channel.permissionOverwrites.edit(data.MemberID, {
                                        SEND_MESSAGES: true
                                    })
                                    i.reply({ embeds: [embed], ephemeral: true })
                                })
                            }

                            if (i.customId === "close") {
                                db.findOne({ ChannelID: i.channel.id }, async (err, data) => {
                                    if (!i.member.permissions.has("MANAGE_CHANNELS")) return i.reply({ content: `لا يمكنك استخدام الازرار`, ephemeral: true })
                                    if (err) throw err
                                    if (!data) return i.reply({ content: `لايوجد بيناتات لهاذي التذكرة`, ephemeral: true })
                                    if (data.Closed == true) return i.reply({ content: `التذكرة بالفعل مقفله الرجاء الانتظر الى ان تنحذف`, ephemeral: true })
                                    const attach = await createTranscript(i.channel, {
                                        limit: -1,
                                        returnBuffer: false,
                                        fileName: `${data.Type} - ${data.TicketID}.html`
                                    })
                                    const embed = new MessageEmbed()
                                        .setColor("WHITE")
                                    await db.updateOne({ ChannelID: i.channel.id }, { Closed: true })

                                    const member = client.users.cache.get(data.MemberID)
                                    const Message = await client.channels.cache.get(config.client.transcriptID).send({ embeds: [embed.setAuthor({ name: member.tag, iconURL: member.displayAvatarURL({ dynamic: true }) }).setTitle(`TransScript Type: ${data.Type}\nID: ${data.TicketID}`)], files: [attach] })

                                    await i.reply({ content: `التذكرة سوف تحذف بعد 10 ثواني` })
                                    setTimeout(async () => {
                                        i.channel.delete()
                                        await db.deleteOne({ ChannelID: i.channel.id })

                                    }, 10 * 1000)
                                })
                            }
                        })
                    })
                    collected.reply({ content: `Done Opened Ticket`, ephemeral: true })
                }
            })

        } catch (e) {
            console.log(e)
        }
    }
}