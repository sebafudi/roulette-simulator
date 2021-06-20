exports = module.exports = function(socketio, mongoose, Promise, users){
    let db = mongoose.connecion;
    var userBetSchema = mongoose.Schema({
        id64: String,
        betColor: String,
        betAmount: Number
    });
    var roundSchema = mongoose.Schema({
        roundNo: Number,
        date: Date,
        hash: String,
        bets: [userBetSchema]
    });
    var toExport = {
        dbRound: mongoose.model('round', roundSchema),
        dbBets: mongoose.model('userBet', userBetSchema)
    }
    return toExport;
};
