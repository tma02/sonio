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
var playingAlbum = '';
var player;
var nextPlayer;
var preloading = false;
var metadata;
var lib;

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
    if (duration - val <= 1000 && !preloading) {
      var preloadInterval = setInterval(function() {
        window.player.device.updateTime();
        if (duration - window.player.device.currentTime <= 420 && nextPlayer == null) {
          var track = nextTrack(false);
          nextPlayer = AV.Player.fromURL('http://localhost:49579/' + track.url);
          nextPlayer[track.play ? 'play' : 'preload']();
          nextPlayer.url = track.url;
          hookPlayerEvents(nextPlayer);

          setTimeout(function() {
            window.player.stop();
            var track = nextTrack(true);
            if (nextPlayer.url == track.url) {
              window.player = nextPlayer;
              nextPlayer = null;
            }
            else {
              window.player = AV.Player.fromURL('http://localhost:49579/' + track.url);
            }
            hookPlayerEvents(window.player);
            window.player[track.play ? 'play' : 'preload']();
            playing = track.play;
            syncPlaying();
            preloading = false;
          }, 500);

          clearInterval(preloadInterval);
        }
      }, 50);
      preloading = true;
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
  var libraryObj = {
    albums: lib.albums
  }
  loadView('/library-view', libraryObj);
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
  syncPlaying();
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
  renderContextMenu({items: [{text: 'Test', func: function(){console.log('hello world')}}], clientX: e.clientX, clientY: e.clientY});
  $('.context-layer').css('display', 'inherit');
});

$('.context-layer').click(function() {
  closeContextMenu();
});

function closeContextMenu() {
  $('.context-menu').css('display', 'none');
  $('.context-layer').css('display', 'none');
}

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
  return (hour > 0 ? hour + ':' + ((min.toFixed(0) % 60) >= 10 ? '' : '0') : '') + (min.toFixed(0) % 60) + ':' + sec;
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
  $('.fullscreen-cover').fadeOut(500);
}

function syncPlaying() {
  $('[id=list-play]').html('play_arrow');
  $('[id=list-play]').parent().parent().removeClass('active');
  if (playing && $('.view-header').find('#name').html() == playingAlbum) {
    $('[index=' + playingIndex + ']').html('pause');
    $('[index=' + playingIndex + ']').parent().parent().addClass('active');
  }
  else if (!playing && $('.view-header').find('#name').html() == playingAlbum) {
    $('[index=' + playingIndex + ']').parent().parent().addClass('active');
  }
  $('#play').html(playing ? 'pause' : 'play_arrow');
  //image for cover
  var imgSrc = getTrackPicture(lib.albums[playingAlbum].tracks[playingIndex]);
  $('.cover-wrapper').find('.cover-img').attr('src', imgSrc);
  $('.cover-wrapper').find('.cover-img').removeAttr('style');
}

function nextTrack(incrementIndex) {
  if (repeat == REPEAT_SONG) {
    return {play: true, url: lib.albums[playingAlbum].tracks[playingIndex].url};
  }
  else if (playingIndex == Object.keys(lib.albums[playingAlbum].tracks).length) {
    if (repeat == REPEAT_LIST) {
      playingIndex = incrementIndex ? 1 : playingIndex;
      return {play: true, url: lib.albums[playingAlbum].tracks[1].url};
    }
    else if (repeat == NO_REPEAT) {
      playingIndex = incrementIndex ? 1 : playingIndex;
      return {play: false, url: lib.albums[playingAlbum].tracks[1].url};
    }
  }
  return {play: true, url: lib.albums[playingAlbum].tracks[(incrementIndex ? ++playingIndex : (Number(playingIndex) + 1))].url};
}

//https://jsperf.com/encoding-xhr-image-data/51
function arrayBufferDataUri(raw) {
  var base64 = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
  var bytes = new Uint8Array(raw)
  var byteLength = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength = byteLength - byteRemainder
  
  var a, b, c, d
  var chunk
  
  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63 // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }
  
  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]
  
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4 // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
    a = (chunk & 16128) >> 8 // 16128 = (2^6 - 1) << 8
    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2 // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return 'data:image/jpeg;base64,' + base64
}

function getAlbumArtist(album) {
  var trackArtists = [];
  var artistMap = [];
  if (album.meta.artist.length != 0) {
    return album.meta.artist[0];
  }
  else {
    return album.tracks[0] == null ? album.tracks[1].meta.artist[0] : album.tracks[0].meta.artist[0];
  }
}

function getAlbumPlaytime(album) {
  var totalDuration = 0;
  for (var k in album.tracks) {
    totalDuration += album.tracks[k].meta.duration;
  }
  return totalDuration;
}

function getTrackPicture(track) {
  var imgSrc = '';
  if (track.meta.picture[0] != null) {
    imgSrc = arrayBufferDataUri(track.meta.picture[0].data.data);
  }
  return imgSrc;
}

function renderContextMenu(contextObj) {
  $('.context-menu').css('left', contextObj.clientX);
  $('.context-menu').css('top', contextObj.clientY);
  $('.context-menu').html('');
  for (var k in contextObj.items) {
    /*var id = window.btoa(JSON.stringify(contextObj.items[k], function(key, val) {
      if (typeof val === 'function') {
        return val + '';
      }
      return val;
    }));*/
    var btn = $('<div class="context-btn">' + contextObj.items[k].text + '</div>');
    $('.context-menu').append(btn);
    btn.click(function() {
      closeContextMenu();
      contextObj.items[k].func();
    });
  }
  $('.context-menu').css('display', 'inherit');
}