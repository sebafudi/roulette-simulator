const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
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
const DDDoS = require('dddos');
const bets = require('./modules/bets')(socketio, mongoose, Promise, users);
// roulette.gen.generate(1000);

var index = require('./routes/index');

let db = mongoose.connection;

var hashSchema = mongoose.Schema({
    no: Number,
    hash: String
});

var app = express();

app.use(new DDDoS({
    rules: [
        {
            regexp: ".*",
            maxWeight: 20
        }, {
            string: "/aaaa",
            weight: 50,
            maxWeight: 50
        }
    ]
}).express('ip', 'path'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
    // secret: 'asdfff',
    // store: sessionStore,
    // resave: true,
    // saveUninitialized: true

    secret: 'keyboard cat',
    saveUninitialized: false, // don't create session until something stored
	resave: false, //don't save session if unmodified
    store: sessionStore
});
app.use(sessionMiddleware);
////////////////////-----Session Handler

////////////////////+++++Steam Login
var steamKey = 'key=DADC1FA878076C82F86C9A2BD22DE591';
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
			//console.log(request.user.stamId);
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
var numbers = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
var positionsN = [7, 0, 2, 4, 6, 9, 11, 13, 14, 12, 10, 8, 5, 3, 1];
var no = 98;
function gameResultFromSeed(seed){
	const num = parseInt(seed.substr(0, 52 / 4), 16);
	return num % 15;
}
function isRoundBonusRound(seed) {
  const num = parseInt(seed.substr(52 / 4, 52 / 4), 16);
  return (num % 100) === 0;
}
function randomShiftFromSeed(seed) {
  const num = parseInt(seed.substr(6, 66 / 6), 16);
  return (num % 91) + 5;
}
var number;
var random;

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
        // users.db.findOneAndUpdate({id64: socket.request.session['id64']}, {isOnline: false}, {'upsert': true}).exec();
        // usersOnline--;
        // socketio.emit('update players count', usersOnline);
        console.log((typeof socket.request.session['id64'] == 'undefined' ? 'someone' : socket.request.session['userNick']) + ' disconnected');
        // var index = usersOnlineArr.indexOf(socket.request.session['id64']);
        // usersOnlineArr.splice(index, 1);
        // if (!usersOnlineArr.includes(socket.request.session['id64'])) {
        //     var index = usersOnlineArrU.indexOf(socket.request.session['id64']);
        //     usersOnlineArrU.splice(index, 1);
        // }
        // console.log(usersOnlineArr);
        // if (typeof socket.request.session['id64'] !== 'undefined') {
        //     usersOnlineArr.remove(socket.request.session['id64']);
        //     var index = usersOnlineArr.indexOf(socket.request.session['id64']);
        //     usersOnlineArr.splice(index, 1);
        //     if (!usersOnlineArr.includes(socket.request.session['id64'])) {
        //         usersOnlineArrU.remove(socket.request.session['id64']);
        //     }
        // }
        // socketio.emit('update players count', usersOnlineArrU.length);
    })
});

/*
CREATE TABLE IF NOT EXISTS hashes
(
no int NOT NULL AUTO_INCREMENT,
hash TEXT,
number int,
isBonus boolean,
PRIMARY KEY (no)
);
*/
setTimeout(roll, 1000);
var gameInfo = {
    hash: null,
    rolledNumber: 0,
    isBonus: true,
    isRolling: false,
    randomShift: 50,
    toRoll: null,
    rollTime: 8000
}
// var total = 0;
// roulette.find({}, function(err, res) {
//     roulette.count({}, function(err, count) {
//         for (var a = 0; a < count; a++){
//             total += res[a].no;
//             console.log(total);
//         }
//     })
// })
mongoose.connection.collections['rounds'].drop( function(err) {
    console.log('collection dropped');
});
var rollInterval = 20000;
function roll() {
    roulette.db.find({no: no}, function(err, res) {
        if (err) throw err;
        gameInfo.isRolling = true;
        gameInfo.hash = (res[0].hash);
        gameInfo.rolledNumber = gameResultFromSeed(res[0].hash);
        gameInfo.isBonus = isRoundBonusRound(res[0].hash);
        gameInfo.randomShift = randomShiftFromSeed(res[0].hash);
        console.log('-------rolling-------');
        console.log('no: ' + (no),'number: ' + gameInfo.rolledNumber,'randomShift: ' + gameInfo.randomShift, 'isBonus: ' + gameInfo.isBonus, 'hash: ' + gameInfo.hash);
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
                Promise.each(round.bets, function(user) {//round.bets.forEach(function(user) {
                    var number = gameResultFromSeed(round.hash);
                    if (number <= 7 && number !== 0) {
                        return users.db.find({id64: user.id64}).then(function(userB) {
                            userB = userB[0];
                            users.db.findOneAndUpdate({id64: user.id64}, {balance: userB.balance+user.betAmount*2}, {'upsert': true}).exec();
                            socketio.emit('sync user balance', userB.balance+user.betAmount*2)
                            // users.db.findOneAndUpdate({id64: user.id64}, {balance: userB+user.betAmount}, {'upsert': true}).exec().err(function(err) {throw err});
                            // console.log(userB.balance);
                            // socket.emit('sync user balance', userB.balance+user.betAmount)
                        });
                        console.log('red');
                    } else if (number >= 8 && number !== 0) {
                        console.log('black');
                    } else if (number === 0) {
                        console.log('green');
                    }

                    // return users.db.find({id64: message.id64}).then(function(user) {
                    //     message.nick = user[0].nick;
                    //     message.avatar = user[0].avatar;
                    //     socket.emit('chat message toClient', message);
                    // })
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
function gameResultFromSeed(seed){
    const num = parseInt(seed.substr(0, 52 / 4), 16);
    return num % 15;
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

/*
var rolling = setInterval(function() {
    if (gameInfo.nextRoll !== null){
        var now = new Date().getTime();
        distance = gameInfo.nextRoll - now;
        seconds = Math.floor((distance % (1000 * 60)) / 1000);
        miliseconds = Math.floor((distance % (100)));
        if (typeof lastSecond !== 'undefined' && lastSecond === seconds) return;
        lastSecond = seconds;
        console.log(seconds);
        if (seconds <= 0) {
            roll();
            gameInfo.nextRoll = null;
            delete miliseconds;
            delete seconds;
        }
    }
}, 10);*/


/*
var distance;
setTimeout(roll, 10);
var rolling = setInterval(function() {
    if (gameInfo.nextRoll !== null){
        var now = new Date().getTime();
        distance = gameInfo.nextRoll - now;
        seconds = Math.floor((distance % (1000 * 60)) / 1000);
        miliseconds = Math.floor((distance % (100)));
        if (typeof lastSecond !== 'undefined' && lastSecond === seconds) return;
        lastSecond = seconds;
        console.log(seconds);
        if (seconds <= 0) {
            roll();
            gameInfo.nextRoll = null;
            delete miliseconds;
            delete seconds;
        }
    }
}, 10);*/

//setInterval(roll, gameInfo.rollTime + 5000);
/*
var lastPos;
var pos;
function roll() {
    console.log(no);
    if (no > 0) {
        no--;
    } else {
        throw 'out of hashes!';
    }
    connection.query('SELECT * FROM `hashes` WHERE `no` LIKE ' + no, function (error, results, fields) {
        if (error) throw error;
        var hash = results[0].hash;
        number = gameResultFromSeed(hash);
        var isBonus = isRoundBonusRound(hash);
        console.log(number);
        if (typeof lastPos === 'undefined') {
            //var randomI = (Math.floor(Math.random() * 15) + 0);
            //randomI = 7;
            random = positionsN[number]*100 + (Math.floor(Math.random() * 90) + 5);
            lastPos = random;
            pos = random;
            console.log(numbers[positionsN[number]], random, pos);
            socketio.emit('roulette roll', random)
        } else {
            //var number = (Math.floor(Math.random() * 15) + 0);
            //randomI = 7;
            random = positionsN[number]*100 + (Math.floor(Math.random() * 90) + 5);
            lastPos2 = random;
            random -= lastPos;
            pos += random;
            console.log(numbers[positionsN[number]], random, pos);
            socketio.emit('roulette roll', random)
            lastPos = lastPos2;
            delete lastPos2;
        }
    });
}*/
/*
var interval = 10000;
var timer = setInterval(function() {
    var now = new Date().getTime();
    if (typeof gameInfo.nextRoll === 'undefined') {
        gameInfo.nextRoll = now + interval;
    } else {
        distance = gameInfo.nextRoll - now;
        seconds = Math.floor((distance % (1000 * 60)) / 1000);
        miliseconds = Math.floor((distance % (100)));
        if (typeof lastSecond !== 'undefined' && lastSecond === seconds) return;
        console.log(miliseconds, seconds);
        lastSecond = seconds;
        if (seconds <= 0) {
            roll();
            delete gameInfo.nextRoll;
            delete distance;
            delete seconds;
        }
    }
}, 100);*/

/*
var countDownDate = new Date("Jan 5, 2018 15:37:25").getTime();

// Update the count down every 1 second
var x = setInterval(function() {

  // Get todays date and time
  var now = new Date().getTime();
  console.log(now);

  // Find the distance between now an the count down date
  var distance = countDownDate - now;

  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display the result in the element with id="demo"

  // If the count down is finished, write some text
  if (distance < 0) {
    clearInterval(x);
  }
}, 1000);
*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', function(req, res, next) {
    console.log(req.session);
    // if (req.session['id64'] === '76561198096940370') { //ja
    // if (req.session['id64'] === '76561198171263003') { //ezi
    // if (req.session['id64'] === '76561198053261228') { //alpin
    //     res.send("Ban hammer has spoken!");
    //     return;
    // }
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
