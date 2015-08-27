window.$ = window.jQuery = require('../../node_modules/jquery/dist/jquery.js');
var ipc = require('ipc');
var playing = false;
const NO_REPEAT = 0;
const REPEAT_LIST = 1;
const REPEAT_SONG = 2;
var repeat = NO_REPEAT;
var shuffle = false;
var fullscreen = false;
var fullscreenCover = false;
var duration = 0;
var player;
var metadata;
//Test
loadTrack('/test4.flac');
loadView('/album-view');
//IPC events
ipc.on('showScreen', function(arg) {
  loadScreen(arg);
  $('.fullscreen-cover').css('display', 'inherit');
});
ipc.on('hideScreen', function(arg) {
  hideScreen();
});
//Player
function hookPlayerEvents(player) {
  player.on('duration', function(val) {
    duration = val;
    $('#time').find('#remaining').html('-' + msToString(val, true));
    $('#time').find('#current').html(msToString(0, false));
    $('#slider-inner').css('width', 0 + '%');
  });
  player.on('progress', function(val) {
    $('#slider-inner').css('width', (100 * (val / duration)) + '%');
    $('#time').find('#current').html(msToString(val, false));
    $('#time').find('#remaining').html('-' + msToString(duration - val, true));
  });
  player.on('metadata', function(val) {
    metadata = val;
    $('#title').html(metadata.title);
    $('#subtitle').html(metadata.album + ' - ' + metadata.artist);
  });
}
//Title bar buttons
$('#close').click(function(e) {
  ipc.send('windowCtl', {fn: 'close', args: []});
});
$('#mini').click(function(e) {
  ipc.send('windowCtl', {fn: 'minimize', args: []});
});
$('#full').click(function(e) {
  fullscreen = !fullscreen;
  ipc.send('windowCtl', {fn: 'setFullScreen', args: fullscreen});
});
//Side bar buttons
$('#albums').click(function(e) {
  var albums = ipc.sendSync('queryStore', 'albums');
  var albumObj = {
    meta: {
      name: albums['Magnifique'][1].metadata.album,
      year: albums['Magnifique'][1].metadata.year,
      subtitle: albums['Magnifique'][1].metadata.artist,
      tracks: albums['Magnifique'].length,
      playtime: 'unknown'
    },
    tracks: albums['Magnifique']
  };
  loadView('/album-view', albumObj);
});
$('#songs').click(function(e) {
  loadView('/playlist-view');
});
//Player control buttons
$('#fullscreen').click(function(e) {
  fullscreenCover = !fullscreenCover;
  ipc.send('windowCtl', {fn: 'setFullScreen', args: fullscreenCover ? true : fullscreen});
  $('.fullscreen-cover').css('display', 'inherit');
});
$('#next').click(function(e) {
  //todo
});
$('#back').click(function(e) {
  //todo
});
$('#play').click(function(e) {
  player[playing ? 'pause' : 'play']();
  playing = !playing;
  $('#play').html(playing ? 'pause' : 'play_arrow');
});
$('#slider').click(function(e) {
  var posX = $(this).css('margin-left').replace('px', '');
  var relX = e.pageX - posX;
  if (player.seek(((relX / $(this).innerWidth()) * duration) - (duration / 100)) == -1) {
    $('#slider-label').html('No seektable');
    $('#slider-label').css('opacity', 1);
    setTimeout(function() {
      $('#slider-label').css('opacity', 0);
    }, 750);
  }
});
$('#repeat').click(function(e) {
  repeat++;
  if (repeat > REPEAT_SONG) {
    repeat = NO_REPEAT;
  }
  $('#repeat').html(repeat == REPEAT_SONG ? 'repeat_one' : 'repeat');
  $('#repeat').css('color', repeat != NO_REPEAT ? '#eef' : '');
});
$('#shuffle').click(function(e) {
  shuffle = !shuffle;
  $('#shuffle').css('color', shuffle ? '#eef' : '');
});
//UI events
$('.info').hover(function(e){
  $('#slider').css('width', 'calc(240px - 24px)');
  $('#slider').css('margin-left', '12px');
  $('#slider').css('bottom', '22px');
  $('#slider').css('height', '8px');
}, function(e) {
  $('#slider').css('margin-left', '0');
  $('#slider').css('width', '100%');
  $('#slider').css('bottom', '-4px');
  $('#slider').css('height', '4px');
});
$('.info').bind('contextmenu', function(e) {
  console.log('contextmenu');
  return false;
});
//Util
function msToString(val, remaining) {
  var sec = val / 1000;
  var min = sec / 60;
  var hour = min / 60;
  hour = hour.toFixed(0);
  sec = (sec % 60).toFixed(0);
  if (sec < 10) {
    sec = '0' + sec;
  }
  return hour > 0 ? hour + ':' : '' + (min % 60).toFixed(0) + ':' + sec;
}
function loadTrack(url, playAfterLoad) {
  if (player != null && player.device.device != null) {
    player.stop();
    playing = false;
  }
  player = AV.Player.fromURL('http://localhost:49579/' + url);
  hookPlayerEvents(player);
  player[playAfterLoad ? 'play' : 'preload']();
  playing = playAfterLoad;
  $('#play').html(playing ? 'pause' : 'play_arrow');
}
function loadView(url, content) {
  var contentReq = new XMLHttpRequest();
  contentReq.addEventListener('load', function() {
    $('.content').html(this.responseText);
    renderContent(content);
  });
  contentReq.open('get', 'http://localhost:49580/views' + url + '/index.html', true);
  contentReq.send();

  var cssReq = new XMLHttpRequest();
  cssReq.addEventListener('load', function() {
    $('#view-style').html(this.responseText);
    renderContent(content);
  });
  cssReq.open('get', 'http://localhost:49580/views' + url + '/index.css', true);
  cssReq.send();
}
function loadScreen(url, content) {
  var contentReq = new XMLHttpRequest();
  contentReq.addEventListener('load', function() {
    $('.fullscreen-cover').html(this.responseText);
    renderContent(content);
  });
  contentReq.open('get', 'http://localhost:49580/screens' + url + '/index.html', true);
  contentReq.send();

  var cssReq = new XMLHttpRequest();
  cssReq.addEventListener('load', function() {
    $('#screen-style').html(this.responseText);
    renderContent(content);
  });
  cssReq.open('get', 'http://localhost:49580/screens' + url + '/index.css', true);
  cssReq.send();
}
function hideScreen() {
  $('.fullscreen-cover').css('display', 'none');
}
