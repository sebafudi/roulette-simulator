function drawRouletteTable() {
    for (var a = 0; a < 8; a++){
        numbers.forEach(function(number) {
            $('<th/>', {
                class: ''+(number == 0 ? 'green' : (number <= 7 ? 'red' : 'black')),
                text: ''+number
            }).appendTo('#roulette > tbody > tr');
        });
    }
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
var numbers = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8];
var positionsN = [7, 0, 2, 4, 6, 9, 11, 13, 14, 12, 10, 8, 5, 3, 1];
var pos;
var lastRoll;
var isRolling = false;
var rouletteTempOffset = 0;
$(document).ready(function() {
    drawRouletteTable();
    if(document.addEventListener) document.addEventListener("visibilitychange", visibilityChanged);
    function visibilityChanged() {
        if (typeof rouletteTimer === !'undefined') {
            clearInterval(rouletteTimer);
        }
        $('#roullettePreviousBets > .roullettePreviousBet').remove();
        socket.emit('roulette sync');
    }
    socket.on('roulette roll', function(gameInfo, lastNumber, lastShift) {
        if(document.hidden) {
            socket.emit('roulette sync');
        } else {
            roll(gameInfo, true);
        }
    });
    socket.emit('chat load');
    socket.on('connect', function() {
    });
    var rouletteTimer;
    socket.on('roulette sync', function(gameInfo) {
        addLastNumber(gameInfo);
        drawRouletteTimer(gameInfo.toRoll);
        if (gameInfo.toRoll > 20000) {
            isRolling = true;
        }
        roll(gameInfo, false);
        clearInterval(rouletteTimer);
        if (!document.hidden) {
            if (gameInfo.toRoll <= 20000) {
                lastDate = new Date().getTime();
                rouletteTimer = setInterval(function() {
                    date = new Date().getTime();
                    gameInfo.toRoll -= date - lastDate;
                    drawRouletteTimer(gameInfo.toRoll);
                    if (gameInfo.toRoll <= 0) {
                        $('#timer').html('***ROLLING***');
                        clearInterval(rouletteTimer);
                        return;
                    }
                    lastDate = date;
                }, 10);
            } else {
                $('#timer').html('***ROLLING***');
                $('#timerProgress').css({right: $('#timerContainer').width()});
            }
        }
    })
    function drawRouletteTimer(timeToRoll) {
        if (timeToRoll >= 20000) {
            $('#timer').html('***ROLLING***');
            return;
        }
        seconds = Math.floor((timeToRoll % (1000 * 60)) / 1000).toString();
        miliseconds = Math.floor(timeToRoll/10).toString().slice(-2);
        $('#timer').html(seconds+':'+miliseconds);
        $('#timerProgress').css({right: $('#timerContainer').width() - (timeToRoll.map(0, 19500, 0, 100)/100)*$('#timerContainer').width()});
    }
    $(window).resize(function() {
        $('#roulette').css({left: (pos + $('#rouletteC').width()/2)});
        if (isRolling) {
            $('#timerProgress').css({right: $(window).width()});
        }
        //$('#roulette').stop(false, false);
    });
    function addLastNumber(gameInfo) {
        if ($('#roullettePreviousBets > li:first-child').data('hash') != gameInfo.hash) {
            if($('#roullettePreviousBets').find(".roullettePreviousBet").length !== 0) {
                var currNum = gameResultFromSeed(gameInfo.hash);
                $('<li />', {
                    class: 'roullettePreviousBet ' + (currNum >= 8 && currNum !== 0 ? 'black' : '') + (currNum < 8 && currNum !== 0 ? 'red' : '') + (currNum === 0 ? 'green bonus' : ''),
                    text: currNum
                }).prependTo('#roullettePreviousBets').data('hash', gameInfo.hash);
                $('#roullettePreviousBets li:last').remove();
            } else {
                var currHash = gameInfo.hash;
                var currNum = gameResultFromSeed(currHash);
                for (var i = 0; i < 7; i++) {
                    $('<li />', {
                        class: 'roullettePreviousBet ' + (currNum >= 8 && currNum !== 0 ? 'black' : '') + (currNum < 8 && currNum !== 0 ? 'red' : '') + (currNum === 0 ? 'green bonus' : ''),
                        text: currNum
                    }).appendTo('#roullettePreviousBets').data('hash', currHash);
                	//$('.chatMessage.activeChat').data('date', content.date);
                    currHash = CryptoJS.SHA256(currHash).toString();
                    currNum = gameResultFromSeed(currHash);
                }
            }
        }
        // if ($('#roullettePreviousBets > li:first-child').data('hash') != hash) {
        //     console.log($('#roullettePreviousBets > li:first-child').data('hash'));
        //     if($('#roullettePreviousBets').find(".roullettePreviousBet").length !== 0) {
        //         if(!isRolling) {
        //             console.log('bets');
        //             var currNum = gameResultFromSeed(hash);
        //             $('<li />', {
        //                 class: 'roullettePreviousBet ' + (currNum >= 8 && currNum !== 0 ? 'black' : '') + (currNum < 8 && currNum !== 0 ? 'red' : '') + (currNum === 0 ? 'green bonus' : ''),
        //                 text: currNum
        //             }).prependTo('#roullettePreviousBets').data('hash', hash);
        //             $('#roullettePreviousBets li:last').remove();
        //         }
        //     } else {
        //         console.log('nobets');
        //         var currHash = hash;
        //         var currNum = gameResultFromSeed(currHash);
        //         for (var i = 0; i < 7; i++) {
        //             $('<li />', {
        //                 class: 'roullettePreviousBet ' + (currNum >= 8 && currNum !== 0 ? 'black' : '') + (currNum < 8 && currNum !== 0 ? 'red' : '') + (currNum === 0 ? 'green bonus' : ''),
        //                 text: currNum
        //             }).appendTo('#roullettePreviousBets').data('hash', currHash);
        //         	//$('.chatMessage.activeChat').data('date', content.date);
        //             currHash = CryptoJS.SHA256(currHash).toString();
        //             currNum = gameResultFromSeed(currHash);
        //         }
        //     }
        // }
    }
    function gameResultFromSeed(seed){
    	const num = parseInt(seed.substr(0, 52 / 4), 16);
    	return num % 15;
    }
    function roll(gameInfo, animate) {
        if (animate === false) {
            pos = -1500 - positionsN[gameInfo.rolledNumber]*100 - gameInfo.randomShift;
            $('#roulette').css({left: (pos + $('#rouletteC').width()/2)});
            if(gameInfo.toRoll < 20000) {
                isRolling = false;
            }
        } else {
            isRolling = true;
            var rouletteWidth = $('#rouletteC').width();
            lastRouletteWidth = rouletteWidth;
            $('#roulette').animate({left: '-=' + ((pos + (positionsN[gameInfo.rolledNumber] * 100 + gameInfo.randomShift) + (1500 * 6))) + 'px'}, {
            duration: gameInfo.rollTime,
            easing: 'roulette',
            complete: function() {
                pos = -1500 - positionsN[gameInfo.rolledNumber]*100 - gameInfo.randomShift;
                $('#roulette').css({left: (pos + $('#rouletteC').width()/2)});
                isRolling = false;
            },
            step: function(now, fx) {
                rouletteWidth = $('#rouletteC').width();
                if (lastRouletteWidth - rouletteWidth !== 0) {
                    fx.end = fx.end - ((lastRouletteWidth - rouletteWidth)/2);
                }
                lastRouletteWidth = rouletteWidth;
            },
        });
        }
    }
    $('#betRed').click(function() {
        betData = 55
        socket.emit('bet Red', betData);
    });
    $('#betGreen').click(function() {
        betData = 55
        socket.emit('bet Green', betData);
    });
    $('#betBlack').click(function() {
        betData = 55
        socket.emit('bet Black', betData);
    });
});
$.easing.roulette = function(x, t, b, c, d) {
	var ts=(t/=d)*t;
	var tc=ts*t;
	return b+c*(-6*tc*ts + 19.595*ts*ts + -23.19*tc + 10.595*ts);
}


//sendPost("test", {"data": "adsasdsadsa", "foo": "bar"}, function(totalTime, res) {console.log("data: " + res);});

function sendPost(path, data, callback) {
    var ajaxTime= new Date().getTime();
    $.ajax({
        type: "POST",
        url: path,
        data: data,
        success: function(res) {
            var totalTime = new Date().getTime()-ajaxTime;
            callback(totalTime, res);
        }
    });
}
