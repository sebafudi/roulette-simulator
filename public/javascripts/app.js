console.log("%cWarning message","font: 2em sans-serif; color: red;")
console.log("%cCSVictory will NEVER tell you to paste anything here. You are about to send your entire balance to a scammer. You have been warned.","font: 1.5rem sans-serif")
var socket = io.connect('http://sebafudi.tech:8080');
$(document).ready(function() {
});
socket.on('sync user balance', function(balance) {
    if (balance >= 0) {
        $('.userBalance').text(convertToDollars(balance));
    } else {
        $('.userBalance').html("CONTACT SUPPORT");
    }
})
function convertToDollars(coins) {
    var cents = coins % 100;
    var dollars = Math.floor(coins/100);
    return dollars + '.' + (cents >= 10 ? cents : '0' + cents);
}
function convertToCoins(dollars) {
    if (dollars.match(/^\s*[0-9]*([,]|[.])[0-9]{2}\s*$/) != null) {
        return parseInt(dollars.replace(',','').replace('.',''));
    } else if (dollars.match(/^\s*[0-9]*([,]|[.])[0-9]\s*$/) != null) {
        return parseInt(dollars.replace(',','').replace('.',''))*10;
    } else if (dollars.match(/^\s*[0-9]*([,]|[.])?\s*$/) != null) {
        return parseInt(dollars.replace(',','').replace('.',''))*100;
    } else {
        return false;
    }
}
