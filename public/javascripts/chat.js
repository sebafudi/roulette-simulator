$(document).ready(function() {
	$('textarea').shiftenter({
		focusClass: 'shiftenter',       	  	 	  /* CSS class used on focus */
		inactiveClass: 'shiftenterInactive',	  /* CSS class used when no focus */
		hint: '', 										  /* hint shown */
		metaKey: 'shift',                  			  /* meta key that triggers a line-break, allowed values: 'shift', 'ctrl' */
		pseudoPadding: '0 10'              		  /* padding (bottom, right) of hint text */
	});
    // $('#chatTextArea')
	// $(document).on('click', '.chatAreaMessage', function () {
	// 	console.log($(this).data('id'));
	// 	console.log($(this).data('id64'));
	// 	console.log($(this).data('nick'));
	// });
    // if ($(window).width() > 1020) {
    //     $('#sideBar').show();
    //     $('#sideBar').css({left: '0'})
    //     $('#sideBar').removeClass('inactive');
    // } else {
    //     $('#sideBar').animate({left: '-400px'});
    //     $('#sideBar').hide();
    //     $('#sideBar').addClass('inactive');
    // }
    var sideBarState;
    if ($(window).width() > 1020) {
        $('#sideBar').css({left: '0'})
		$('#openChatSideBar').addClass('active');
		$('#chatContainer').addClass('active');
        $('#sideBar').removeClass('inactive');
		$('#pageContainer').css({left: $('#sideBar').width() + 'px'});
		sideBarState = true;
    } else {
        $('#sideBar').css({left: '-' + $('#sideBar').width() + 'px'});
        $('#sideBar').addClass('inactive');
		$('#pageContainer').css({left: 0});
		sideBarState = false;
    }
    $(window).resize(function() {
        if (sideBarState === false) {
	        $('#sideBar').css({left: '-' + $('#sideBar').width() + 'px'});
	        $('#sideBar').addClass('inactive');
            return;
        } else if (sideBarState === true) {
            $('#sideBar').css({left: '0'});
            $('#sideBar').removeClass('inactive');
			if ($(window).width() <= 1020) {
				$('#pageContainer').css({left: 0});
			} else {
				$('#pageContainer').css({left: $('#sideBar').width() + 'px'});
			}
            return;
        }
    });
    $('#closeSideBar').click(function() {
		if (!$('#sideBar').hasClass('inactive')) {
			$('#sideBarNav > tbody > tr > td').removeClass('active');
			if ($(window).width() > 1020) {
				$('#pageContainer').animate({left: '0'});
				if (!isRolling) {
					$('#roulette').animate({left: (pos + ($('#rouletteC').width() + 0.8*$('#sideBar').width())/2)}, {
						step: function(now, fx) {
							if (isRolling) {
								$('#roulette').stop();
							}
						}
					})
				}
			}
			//$('#roulette').animate({left: (pos + ($('#rouletteC').width() + $('#sideBar').width())/2)});
	        if (isRolling) {
	            $('#timerProgress').css({right: $(window).width()});
	        }
			$('#sideBar').animate({left: '-' + $('#sideBar').width() + 'px'}, function() {
				$('#sideBar').addClass('inactive');
				$('.sideBarCard.active').removeClass('active');
				sideBarState = false;
			});
		}
	})
	$('#openChatSideBar').click(function() {
		if ($('#sideBar').hasClass('inactive')) {
		    if ($(window).width() > 1020) {
			    $('#pageContainer').animate({left: 0.08*$(window).width() + 200 + 'px'});
				if (!isRolling) {
					$('#roulette').animate({left: (pos + ($('#rouletteC').width() - 0.8*$('#sideBar').width())/2)}, {
						step: function(now, fx) {
							if (isRolling) {
								$('#roulette').stop();
							}
						}
					})
				}
			}
			$('#sideBar').animate({left: '0'}, function() {
	            $('#sideBar').removeClass('inactive');
				sideBarState = true;
			});
		}
		$('.sideBarCard.active').removeClass('active');
		$('#chatContainer').addClass('active');
		$('#sideBarNav > tbody > tr > td').removeClass('active');
		$('#openChatSideBar').addClass('active');
		document.getElementById('chatMessages').lastChild.scrollIntoView(false);
	});
	$('#openStatsSideBar').click(function() {
		if ($('#sideBar').hasClass('inactive')) {
		    if ($(window).width() > 1020) {
			    $('#pageContainer').animate({left: 0.08*$(window).width() + 200 + 'px'});
				if (!isRolling) {
					$('#roulette').animate({left: (pos + ($('#rouletteC').width() - 0.8*$('#sideBar').width())/2)}, {
						step: function(now, fx) {
							if (isRolling) {
								$('#roulette').stop();
							}
						}
					})
				}
			}
			$('#sideBar').animate({left: '0'}, function() {
	            $('#sideBar').removeClass('inactive');
				sideBarState = true;
			});
		}
		$('.sideBarCard.active').removeClass('active');
		$('#userStats').addClass('active');
		$('#sideBarNav > tbody > tr > td').removeClass('active');
		$('#openStatsSideBar').addClass('active');
	});
	$('#openAdminSideBar').click(function() {
		if ($('#sideBar').hasClass('inactive')) {
		    if ($(window).width() > 1020) {
			    $('#pageContainer').animate({left: 0.08*$(window).width() + 200 + 'px'});
				if (!isRolling) {
					$('#roulette').animate({left: (pos + ($('#rouletteC').width() - 0.8*$('#sideBar').width())/2)}, {
						step: function(now, fx) {
							if (isRolling) {
								$('#roulette').stop();
							}
						}
					})
				}
			}
			$('#sideBar').animate({left: '0'}, function() {
	            $('#sideBar').removeClass('inactive');
				sideBarState = true;
			});
		}
		$('.sideBarCard.active').removeClass('active');
		$('#adminSetting').addClass('active');
		$('#sideBarNav > tbody > tr > td').removeClass('active');
		$('#openAdminSideBar').addClass('active');
	});
});
function sendChatMessage() {
	var msg = {
		message: $('#chatTextArea').val(),
	}
	socket.emit('chat message', msg);
	$('#chatTextArea').val('');
	$('#chatTextArea').focus();
	return false;
};
Date.prototype.getFormattedTime = function() {
	var hours = this.getHours();
	var minutes = this.getMinutes();
	return (hours >= 10 ? hours : '0' + hours) + ':' + (minutes >= 10 ? minutes : '0' + minutes);
};
socket.on('update players count', function(count) {
	$('#usersOnlineCount').html(count);
});
socket.on('chat message toClient', function(content) {
	content.date = new Date(content.date);
	$('<table/>', {
		class: 'chatMessage activeChat'
	}).appendTo('#chatMessages');
	$('<tbody/>').appendTo('.chatMessage.activeChat');
	$('<tr/>').appendTo('.chatMessage.activeChat');
	$('<th/>', {
		rowspan: '2',
		class: 'chatAvatar activeChat'
	}).appendTo('.chatMessage.activeChat > tbody > tr');
	$('<img/>', {
		class: 'chatAvatarImg',
		src: content.avatar
	}).appendTo('.chatAvatar.activeChat');
	$('<th/>', {
		class: 'chatNick activeChat',
		text: content.nick
	}).appendTo('.chatMessage.activeChat > tbody > tr');
	$('<th/>', {
		class: 'chatTime activeChat',
		text: content.date.getFormattedTime()
	}).appendTo('.chatMessage.activeChat > tbody > tr');
	$('<tr/>').appendTo('.chatMessage.activeChat');
	$('<td/>', {
		rowspan: '2',
		class: 'chatText activeChat',
		text: content.message
	}).appendTo('.chatMessage.activeChat > tbody > tr:nth-child(2)');
	$('<div/>', {
		class: 'chatContextMenu'
	}).appendTo('.chatMessage.activeChat');
	$('<div/>', {
		text: 'View profile',
		class: 'viewProfile chatContextMenuItem'
	}).appendTo('.chatMessage.activeChat > .chatContextMenu');
	$('<div/>', {
		text: 'Send coins',
		class: 'sendMoney chatContextMenuItem'
	}).appendTo('.chatMessage.activeChat > .chatContextMenu');

	// $('.chatMessage.activeChat').data( "id", content.id );
	$('.chatMessage.activeChat').data('id64', content.id64);
	$('.chatMessage.activeChat').data('nick', content.nick);
	$('.chatMessage.activeChat').data('date', content.date);
	// console.log($('.chatMessage.activeChat').data('date'));
	$('.activeChat.chatNick, .activeChat.chatAvatar').click(function(e) {
		$('.chatContextMenuActive').not($(this).parent().parent().parent()).removeClass('chatContextMenuActive');
		if (!$(this).parent().parent().parent().hasClass('chatContextMenuActive')) {
			$(this).parent().parent().parent().addClass('chatContextMenuActive');
			if ($(this).parent().parent().parent().is(':last-child')) {
				$('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight)
			}
			// if ($('#chatMessages').scrollTop() + $('#chatMessages').height() + $('#chatMessages > table:last-child').outerHeight() >= ($("#chatMessages")[0].scrollHeight)-100) {
			// 	document.getElementById('chatMessages').lastChild.scrollIntoView(false);
			// }
		} else {
			$(this).parent().parent().parent().removeClass('chatContextMenuActive');
		}
	});
	$('body').click(function(e){
		if($(e.target).closest('.chatContextMenu, .chatNick, .chatAvatar').length) {
			return;
		}
		$('.chatContextMenuActive').removeClass('chatContextMenuActive');
	});
	// $('.activeChat.chatNick, .activeChat.chatAvatar').click(function(e) {
	// 	if (!$(this).parent().parent().parent().hasClass('chatContextMenuActive')) {
	// 	$('.chatContextMenuActive').find('.chatContextMenu').css('visibility', 'hidden');
	// 		$('.chatContextMenuActive').removeClass('chatContextMenuActive');
	// 	}
	// 	$(this).parent().parent().parent().find('.chatContextMenu').css('visibility', 'visible');
	// 	$(this).parent().parent().parent().toggleClass('chatContextMenuActive');
	// });
	// $('body').click(function(e){
	// 	if($(e.target).closest('.chatContextMenu').length) {
	// 		return;
	// 	}
	// 	$('.chatContextMenuActive').find('.chatContextMenu').css('display', 'block');
	// 	$('.chatContextMenuActive').removeClass('chatContextMenuActive');
	// });
	$(".activeChat").removeClass("activeChat");
	// console.log($('#chatMessages').scrollTop() + $('#chatMessages > table:last-child').height(), $("#chatMessages")[0].scrollHeight);
	if ($('#chatMessages').scrollTop() + $('#chatMessages').height() + $('#chatMessages > table:last-child').outerHeight() >= ($("#chatMessages")[0].scrollHeight)-100) {
		document.getElementById('chatMessages').lastChild.scrollIntoView(false);
	}
});
