var CryptoJS = require('crypto-js');

var serverSecret =  '0dd09a8a758c8a54607fe396dbe2676d3890c52093bdb391e9a824521f5d35b5';
var serverSeed = serverSecret;

let mongoose = require('mongoose');

var hashSchema = mongoose.Schema({
    no: Number,
    hash: String
});
var hashModel = mongoose.model('hash', hashSchema);


var asdf = {
	generate: function(gamesToGenerate) {
		for (var game = gamesToGenerate; game > 0; --game) {
			var round = saltHash(serverSeed);
			console.log('Game ' +  game + ' is number ' + gameResultFromSeed(round), 'Hash: ' + serverSeed);
			serverSeed = genGameHash(serverSeed);
            var hasz = new hashModel();
            hasz.no = gamesToGenerate-game;
            hasz.hash = serverSeed;
            hasz.save(function(err) {
                if (err) {
                    throw err;
                }
            });
		}
	},
};

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
function randomShiftFromSeed(seed) {
  const num = parseInt(seed.substr(6, 66 / 6), 16);
  return (num % 91) + 5;
}
module.exports = {
    gen: asdf,
    genGameHash,
    gameResultFromSeed,
    saltHash,
    randomShiftFromSeed,
    db: mongoose.model('hash', hashSchema)
}