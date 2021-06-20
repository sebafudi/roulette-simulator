var crypto = require('crypto');
var CryptoJS = require('crypto-js');

var serverSecret =  '0dd09a8a758c8a54607fe396dbe2676d3890c52093bdb391e9a824521f5d35b5';
var clientSeed = '0000examplehash';
var serverSeed = serverSecret;
var terminatingHash = genGameHash(serverSeed);

let mongoose = require('mongoose');
let db = mongoose.connecion;


// var mysql = require('mysql');
//
// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'zeuscsgo'
// });

//
// connection.connect();
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//     if (error) throw error;
//     if (results[0].solution === 2) {
//         console.log('Connected to DB');
//     }
// });

var hashSchema = mongoose.Schema({
    no: Number,
    hash: String
});
var hashModel = mongoose.model('hash', hashSchema);


var asdf = {
	generate: function(gamesToGenerate) {
		for (var game = gamesToGenerate; game > 0; --game) {
			var round = saltHash(serverSeed);
			console.log('Game ' +  game + ' has a crash point of ' + gameResultFromSeed(round) + (isRoundBonusRound(round) == true ? '+' : '-'), 'Hash: ' + serverSeed);
			serverSeed = genGameHash(serverSeed);
            var hasz = new hashModel();
            hasz.no = gamesToGenerate-game;
            hasz.hash = serverSeed;
            hasz.save(function(err) {
                if (err) {
                    throw err;
                }
            });
            // db.hashes.insert(
            //    {
            //      no: game,
            //      hash: serverSeed
            //    }
            // )

			//connection.query('INSERT INTO `hashes` (`hash`) VALUES ("' + round + '")', function (error, results, fields) {
			//	console.log('ok');
		//	});
		}
	},
};
/*	connection.query('INSERT INTO `hashes`(`hash`, `number`, `isBonus`) VALUES (' + serverSeed + ', ' + gameResultFromSeed(round) + ', ' + isRoundBonusRound(round) +')', function (error, results, fields) {*/
function genGameHash(serverSeed) {
	return CryptoJS.SHA256(serverSeed).toString();
}
function gameResultFromSeed(seed){
	const num = parseInt(seed.substr(0, 52 / 4), 16);
	return num % 15;
}
const salt = "0000000000000000019ee980eb5c43e1e4e9d16bee8bb96d9ee691fa2c49c219";
function saltHash(hash) {
  return CryptoJS.SHA256(JSON.stringify([hash, salt])).toString();
}
function isRoundBonusRound(seed) {
  const num = parseInt(seed.substr(52 / 4, 52 / 4), 16);
  return (num % 100) === 0;
}
module.exports = {
    gen: asdf,
    db: mongoose.model('hash', hashSchema)
}








/*
function getPreviousHash(gameHash) {
  return CryptoJS.SHA256(gameHash).toString();
}

function isRoundBonusRound(seed) {
  const num = parseInt(seed.substr(52 / 4, 52 / 4), 16);
  return (num % 100) === 0;
}

function gameResultToColor(bet) {
  if (bet === 0) return "green";
  if (1 <= bet && bet <= 7) return "red";
  if (8 <= bet && bet <= 15) return "black";
}

const salt = "0000000000000000019ee980eb5c43e1e4e9d16bee8bb96d9ee691fa2c49c219";
function saltHash(hash) {
  return CryptoJS.SHA256(JSON.stringify([hash, salt])).toString();
}

function gameResultFromSeed(seed) {
  // warning: slightly biased because of modulo!
  const num = parseInt(seed.substr(0, 52 / 4), 16);
  return num % 15;
}

function getGameInformation(hash) {
  const seed = saltHash(hash), result = gameResultFromSeed(seed);
  return {
    result,
    hash,
    seed,
    color: gameResultToColor(result),
    bonus: isRoundBonusRound(seed),
  };
}
function getPreviousResults(gameHash, count) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(getGameInformation(gameHash));
        gameHash = getPreviousHash(gameHash);
    }
    return results;
}
*/
