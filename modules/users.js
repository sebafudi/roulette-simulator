exports = module.exports = function(mongoose) {
    var userSchema = mongoose.Schema({
        id64: String,
        nick: String,
        avatar: String,
        dateCreated: Date,
        lastLogin: {
            type: Date,
            default: Date.now
        },
        affBy: String,
        balance: {
            type: Number,
            default: 0
        },
        ipList: [{
            type: String,
            default: []
        }],
        affList: [{
            type: String,
            default: []
        }],
        affBalance: {
            type: Number,
            default: 0
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        lastOnline: {
            type: Date,
            default: Date.now
        }
    });
    var userModel = mongoose.model('user', userSchema);
    var toExport = {
        a: 5,
        db: mongoose.model('user', userSchema)
    }
    return toExport;
}
