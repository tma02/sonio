window.$ = window.jQuery = require('../../node_modules/jquery/dist/jquery.js');
var ipc = require('ipc');
var playing = false;
var fullscreen = false;
var duration = 0;
var player = AV.Player.fromURL('http://localhost:49579/test3.flac');
player.preload();
//Player
player.on('duration', function(val) {
  duration = val;
  $('#time').find('#remaining').html('-' + msToString(val, true));
});
player.on('progress', function(val) {
  $('#slider-inner').css('width', (100 * (val / duration)) + '%')
  $('#time').find('#current').html(msToString(val, false));
  $('#time').find('#remaining').html('-' + msToString(duration - val, true));
});
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
//Player control buttons
$('#next').click(function(e) {
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

function loadTrack(url) {
  
}