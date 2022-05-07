const { model, Schema } = require("mongoose")

module.exports = model("ticket", new Schema({
    MemberID: String,
    TicketID: String,
    ChannelID: String,
    Closed: Boolean,
    Locked: Boolean,
    Type: String
}))