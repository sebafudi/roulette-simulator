var steamKey = 'key=DADC1FA878076C82F86C9A2BD22DE591';
exports = module.exports = function(request) {
    var getNick = function (steamid, callback) {
        if (typeof steamid !== 'undefined') {
            if (steamid.length > 0) {
                var url = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?" + steamKey + "&steamids=" + steamid;
                request({
                    url: url,
                    json: true
                }, function (error, response, body) {

                    if (!error && response.statusCode === 200) {
                        callback(body.response.players[0].personaname);
                    }
                })
            }
        }
    }
    var getAvatar = function (steamid, callback) {
        if (typeof steamid !== 'undefined') {
            if (steamid.length > 0) {
                var url = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?" + steamKey + "&steamids=" + steamid;
                request({
                    url: url,
                    json: true
                }, function (error, response, body) {

                    if (!error && response.statusCode === 200) {
                        callback(body.response.players[0].avatarmedium);
                    }
                })
            }
        }
    }
    var getInfo = function (steamid, callback) {
        if (typeof steamid !== 'undefined') {
            if (steamid.length > 0) {
                var url = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?" + steamKey + "&steamids=" + steamid;
                request({
                    url: url,
                    json: true
                }, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                        callback(body.response.players[0]);
                    }
                })
            }
        }
    }
    var toExport = {
        getNick: getNick,
        getAvatar: getAvatar,
        getInfo: getInfo
    }
    return toExport;
}
