const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const socketio = require('socket.io')(http);
const OpenIDStrategy = require('passport-openid').Strategy;
const passport = require('passport');
const roulette = require('./modules/roulette')
const request = require("request");
const mongoose = require('mongoose');
const Promise = require("bluebird");
Promise.promisifyAll(mongoose);
mongoose.connect('mongodb://localhost/csvictory');
const users = require('./modules/users')(mongoose);
const chat = require('./modules/chat')(socketio, mongoose, Promise, users);
const steamAPI = require('./modules/steamAPI')(request);
const bets = require('./modules/bets')(socketio, mongoose, Promise, users);
roulette.gen.generate(1000);

var index = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

////////////////////+++++Session Handler
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var options = {
    url: 'mongodb://localhost/csvictory',
    touchAfter: 24 * 3600 // time period in seconds
}
var sessionStore = new MongoStore(options);
var sessionMiddleware = session({
    secret: 'keyboard cat',
    saveUninitialized: false, // don't create session until something stored
	resave: false, //don't save session if unmodified
    store: sessionStore
});
app.use(sessionMiddleware);
////////////////////-----Session Handler

////////////////////+++++Steam Login
var SteamStrategy = new OpenIDStrategy({
        providerURL: 'http://steamcommunity.com/openid',
        stateless: true,
        returnURL: 'http://sebafudi.tech/auth/openid/return',
        realm: 'http://sebafudi.tech/',
    },
    function(identifier, done) {
        process.nextTick(function () {
            var user = {
                identifier: identifier,
                steamId: identifier.match(/\d+$/)[0]
            };
            return done(null, user);
        });
});
passport.use(SteamStrategy);
passport.serializeUser(function(user, done) {
    done(null, user.identifier);
});
passport.deserializeUser(function(identifier, done) {
    done(null, {
        identifier: identifier,
        steamId: identifier.match(/\d+$/)[0]
    });
});
app.use(passport.initialize());
app.use(passport.session());
app.post('/auth/openid', passport.authenticate('openid'));
app.get('/auth/openid/return', passport.authenticate('openid'),
    function(request, response) {
        console.log(request);
		request.session.id64 = request.user.steamId;
        users.db.find({id64: request.user.steamId}, function (err, res) {
            console.log(res.length);
            if(res.length === 0){
                steamAPI.getInfo(request.user.steamId, function(res) {
                    var user = new users.db();
                    user.id64 = request.user.steamId;
                    user.nick = res.personaname;
                    user.avatar = res.avatarmedium;
                    user.dateCreated = new Date();
                    user.affBy = 'CSVictory';
                    user.save(function(err) {
                        if (err) {
                            throw err;
                        }
                    });
                });
            } else {
            }
        });
        if (request.user) {
            response.redirect('/');
        } else {
            response.redirect('/?failed');
        }
});

app.post('/auth/logout', function(request, response) {
    request.logout();
    // After logging out, redirect the user somewhere useful.
    // Where they came from or the site root are good choices.
    response.redirect(request.get('Referer') || '/')
});

app.get('/loga', function(request, response) {
    response.write('<!DOCTYPE html>')
    if (request.user) {
        response.write(request.session.passport &&
            JSON.stringify(request.user) || 'None');
		console.log(request.session.id64);
        response.write('<form action="/auth/logout" method="post">');
        response.write('<input type="submit" value="Log Out"/></form>');
    } else {
        if (request.query.steamid) {
            response.write('Not logged in.');
        }
        response.write('<form action="/auth/openid" method="post">');
        response.write(
            '<input name="submit" type="image" src="/images/steamLog.png" ' +
            'alt="Sign in through Steam"/></form>');
    }
    response.send();
});
////////////////////-----Steam Login

////////////////////+++++Socket.io initialize
http.listen(8080, function(){
	console.log('listening for socket.io on *:8080');
});
socketio.use(function(socket, next){
    sessionMiddleware(socket.request, {}, next);
})
////////////////////-----Socket.io initialize
var no = 98;

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
var usersOnline = 0;
setInterval(function() {
    users.db.find({isOnline: true}).then(function(res) {
        usersOnline = res.length;
        socketio.emit('update players count', usersOnline);
        Promise.each(res, function(user) {
            var lastOnline = new Date(user.lastOnline).getTime();
            var now = new Date().getTime();
            if (now - lastOnline >= 12000) {
                return users.db.findOneAndUpdate({id64: user.id64}, {isOnline: false}, {'upsert': true}).exec();
            } else {
                return;
            }
        })
    });
}, 1000);
socketio.set('heartbeat interval', 10000);
socketio.on('connection', function(socket) {
    if (typeof socket.request.session['id64'] !== 'undefined') {
        users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {isOnline: true, lastLogin: new Date(), lastOnline: new Date()}, {'upsert': true}).exec();
        socket.conn.on('heartbeat', function() {
            users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {isOnline: true, lastOnline: new Date()}, {'upsert': true}).exec();
            users.db.find({id64: socket.request.session['id64']}).then(function(user) {
                socket.emit('sync user balance', user[0].balance)
            });
        });
    }
    socketio.emit('update players count', usersOnline);
    console.log((typeof socket.request.session['id64'] == 'undefined' ? 'someone' : socket.request.session['userNick']) + ' connected');
    socket.on('roll roulette', function() {
    });
    socket.on('roulette sync', function(){
        socket.emit('roulette sync', gameInfo);
    });
    socket.emit('roulette sync', gameInfo);
    users.db.find({id64: socket.request.session['id64']}).then(function(user) {
        socket.emit('sync user balance', user[0].balance)
    });
    socket.on('bet Red', function(betData) {
        console.log(betData, 'RED');
        if (!gameInfo.isRolling) {
            users.db.find({id64: socket.request.session['id64']}).then(function(user) {
                users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {balance: (user[0].balance-betData)}, {'upsert': true}).exec();
                socket.emit('sync user balance', (user[0].balance-betData))
            });
            var userBet = new bets.dbBets();
            userBet.id64 = socket.request.session['id64'];
            userBet.betColor = 'Red';
            userBet.betAmount = betData;
            bets.dbRound.findOneAndUpdate(
                {roundNo: no},
                {$push: {"bets": userBet}},
                {safe: true, upsert: true},
                function(err, model) {
                    console.log(err);
            });
            console.log(socket.request.session['id64'], 'bet red', no);
        }
    });
    socket.on('bet Green', function(betData) {
        console.log(betData, 'GREEN');
        users.db.find({id64: socket.request.session['id64']}).then(function(user) {
            users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {balance: 0}, {'upsert': true}).exec();
            socket.emit('sync user balance', 0)
        });
    });
    socket.on('bet Black', function(betData) {
        console.log(betData, 'BLACK');
        users.db.find({id64: socket.request.session['id64']}).then(function(user) {
            users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {balance: (user[0].balance+betData)}, {'upsert': true}).exec();
            socket.emit('sync user balance', (user[0].balance+betData))
        });
    });
    socket.on('disconnect', function(){

        console.log((typeof socket.request.session['id64'] == 'undefined' ? 'someone' : socket.request.session['userNick']) + ' disconnected');

    })
});


setTimeout(roll, 1000);
var gameInfo = {
    hash: null,
    rolledNumber: 0,
    isRolling: false,
    randomShift: 50,
    toRoll: null,
    rollTime: 8000
}

mongoose.connection.collections['rounds'].drop( function(err) {
    console.log('collection dropped');
});
var rollInterval = 20000;
function roll() {
    roulette.db.find({no: no}, function(err, res) {
        if (err) throw err;
        gameInfo.isRolling = true;
        gameInfo.hash = (res[0].hash);
        gameInfo.rolledNumber = roulette.gameResultFromSeed(res[0].hash);
        gameInfo.randomShift = roulette.randomShiftFromSeed(res[0].hash);
        console.log('-------rolling-------');
        console.log('no: ' + (no),'number: ' + gameInfo.rolledNumber,'randomShift: ' + gameInfo.randomShift, 'hash: ' + gameInfo.hash);
        gameInfo.nextRoll = rollInterval + gameInfo.rollTime;
        bets.dbRound.findOneAndUpdate(
            {roundNo: no},
            {date: new Date(), hash: gameInfo.hash},
            {'upsert': true}
        ).exec();
        socketio.emit('roulette roll', gameInfo);
        setTimeout(function() {
            var round = new bets.dbRound();
            round.roundNo = no+1;
            round.save(function(err) {
                if (err) {
                    throw err;
                }
            });
            gameInfo.isRolling = false;
            console.log(no+1);
            bets.dbRound.find({roundNo: no+1}).then(function(round) {
                round = round[0];
                Promise.each(round.bets, function(user) {
                    var number = roulette.gameResultFromSeed(round.hash);
                    if (number <= 7 && number !== 0) {
                        return users.db.find({id64: user.id64}).then(function(userB) {
                            userB = userB[0];
                            users.db.findOneAndUpdate({id64: user.id64}, {balance: userB.balance+user.betAmount*2}, {'upsert': true}).exec();
                            socketio.emit('sync user balance', userB.balance+user.betAmount*2)

                        });
                        console.log('red');
                    } else if (number >= 8 && number !== 0) {
                        console.log('black');
                    } else if (number === 0) {
                        console.log('green');
                    }
                 })
            });
        }, gameInfo.rollTime);
        gameInfo.toRoll = gameInfo.rollTime + rollInterval;
        setTimeout(function() {
            socketio.emit('roulette sync', gameInfo);
        }, gameInfo.rollTime + 500);
        rouletteTimer(gameInfo.rollTime + rollInterval, function() {
            roll();
        });
        if (no > 0) {
            no--;
        } else {
            no = 99;
            //throw 'out of hashes!';
        }
    });
}
function rouletteTimer(time, callback) {
    var timerStartTime = new Date().getTime();
    var rouletteInterval = setInterval(function() {
        var now = new Date().getTime();
        gameInfo.toRoll = timerStartTime - now + time;
        if (gameInfo.toRoll <= 0) {
            gameInfo.toRoll = null;
            clearInterval(rouletteInterval);
            callback();
        }
    }, 10);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', function(req, res, next) {
    console.log(req.session);
    if (typeof req.session['id64'] !== 'undefined') {
        users.db.find({id64: req.session['id64']}).then(function(user) {
            console.log(user[0].nick);
            req.session.userNick = user[0].nick;
            req.session.userAvatar = user[0].avatar;
            req.session.userBalance = user[0].balance;
            next();
        });
    } else {
        next();
    }
})
app.use('/', index);
app.use('/aaaa', function(req, res, next) {
    next();
})
app.get('/aaaa', function (req, res) {
    res.write(String("<a href='/'>Index</a>"));
    res.send();
})

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
