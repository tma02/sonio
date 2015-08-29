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
var playingIndex = -1;
var playHistory = [];
var playingAlbum = 'The Wall (UK)';
var player;
var nextPlayer;
var metadata;
var lib;
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
ipc.on('updateLibrary', function(arg) {
  lib = {
    albums: ipc.sendSync('queryStore', 'albums'),
    playlists: ipc.sendSync('queryStore', 'playlists')
  };
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
    if (nextPlayer == null) {
      $('#slider-inner').css('width', (100 * (val / duration)) + '%');
      $('#time').find('#current').html(msToString(val, false));
      $('#time').find('#remaining').html('-' + msToString(duration - val, true));
    }
    if (duration - val <= 300 && nextPlayer == null) {
      console.log('Preloading next track...');
      var track = nextTrack(false);
      nextPlayer = AV.Player.fromURL('http://localhost:49579/' + track.url);
      nextPlayer[track.play ? 'play' : 'preload']();
      nextPlayer.url = track.url;
      hookPlayerEvents(nextPlayer);
      setTimeout(function() {
        window.player.stop();
        var track = nextTrack(true);
        if (nextPlayer.url == track.url) {
          console.log('Using preloaded track');
          window.player = nextPlayer;
          nextPlayer = null;
        }
        else {
          window.player = AV.Player.fromURL('http://localhost:49579/' + track.url);
        }
        hookPlayerEvents(window.player);
        window.player[track.play ? 'play' : 'preload']();
        playing = track.play;
        syncPlayBtns();
      }, 300);
    }
  });
  player.on('metadata', function(val) {
    metadata = val;
    $('#title').html(metadata.title);
    $('#subtitle').html(metadata.album + ' - ' + metadata.artist);
  });
  player.on('end', function() {
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
  var albumObj = {
    meta: {
      name: lib.albums[playingAlbum].meta.name,
      year: lib.albums[playingAlbum].meta.year.split('-')[0],
      artist: lib.albums[playingAlbum].meta.artist,
      tracks: lib.albums[playingAlbum].tracks.length,
      playtime: 'unknown'
    },
    tracks: lib.albums[playingAlbum].tracks
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
  syncPlayBtns();
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
function syncPlayBtns() {
  $('[id=list-play]').html('play_arrow');
  $('[id=list-play]').parent().parent().removeClass('active');
  if (playing) {
    $('[index=' + playingIndex + ']').html('pause');
    $('[index=' + playingIndex + ']').parent().parent().addClass('active');
  }
  $('#play').html(playing ? 'pause' : 'play_arrow');
}
function nextTrack(incrementIndex) {
  if (repeat == REPEAT_SONG) {
    return {play: true, url: lib.albums[playingAlbum].tracks[playingIndex].url};
  }
  else if (repeat == REPEAT_LIST) {
    if (playingIndex == Object.keys(lib.albums[playingAlbum].tracks).length) {
      playingIndex = incrementIndex ? playingIndex : 1;
      return {play: true, url: lib.albums[playingAlbum].tracks[1].url};
    }
  }
  else if (repeat == NO_REPEAT) {
    if (playingIndex == Object.keys(lib.albums[playingAlbum].tracks).length) {
      playingIndex = incrementIndex ? playingIndex : 1;
      return {play: false, url: lib.albums[playingAlbum].tracks[1].url};
    }
  }
  return {play: true, url: lib.albums[playingAlbum].tracks[(incrementIndex ? ++playingIndex : (Number(playingIndex) + 1))].url};
}