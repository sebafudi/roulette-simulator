exports = module.exports = function(socketio, mongoose, Promise, users){
    var chatSchema = mongoose.Schema({
        id64: String,
        date: {
            type: Date,
            default: Date.now
        },
        message: String,
        isDeleted: {
            type: Boolean,
            default: false
        },
    });
    var chatModel = mongoose.model('message', chatSchema);
    socketio.on('connection', function (socket) {
        socket.on('chat load', function() {
            chatModel.aggregate()
                .project({ "id64": 1, "message": 1, "isDeleted": 1, "date": 1, "_id": 0 })
                .sort({"date": -1})
                .limit(40)
                .sort({"date": 1})
                .exec(function(err, results){
                    // handle err
                    Promise.each(results, function(message) {
                        return users.db.find({id64: message.id64}).then(function(user) {
                            message.nick = user[0].nick;
                            message.avatar = user[0].avatar;
                            socket.emit('chat message toClient', message);
                        })
                    })
                });
        })
        socket.on('chat message', function(content) {
            content.message = content.message.trim();
            if (content.message.length >= 2 && content.message.length <= 256 && content.message.match(/^\s*$/) == null) {
                if (typeof socket.request.session['id64'] !== 'undefined') {
                    content.id64 = socket.request.session['id64'];
                }
                users.db.find({id64: socket.request.session['id64']}).then(function(user) {
                    content.nick = user[0].nick;
                    content.avatar = user[0].avatar;
                    content.date = new Date();
                    socketio.emit('chat message toClient', content);
                    var message = new chatModel();
                    message.id64 = content.id64;
                    message.message = content.message;
                    message.save(function(err) {
                        if (err) {
                            throw err;
                        }
                    });
                })
            }
        });
    });
}
