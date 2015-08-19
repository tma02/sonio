window.$ = window.jQuery = require('../../node_modules/jquery/dist/jquery.js');
var ipc = require('ipc');
var playing = false;
var fullscreen = false;
var duration = 0;
var player = AV.Player.fromURL('http://localhost:49579/test2.flac');
player.on('duration', function(val) {
  duration = val;
});
player.on('progress', function(val) {
  $('#slider-inner').css('width', (100 * (val / duration)) + '%')
});
$('#next').click(function(e) {
  //ipc.send('playerCall', {fn: 'seek', args: 15000});
  if (player.seek(15000) == -1) {

  }
});
$('#play').click(function(e) {
  //ipc.send('playerCall', {fn: playing ? 'pause' : 'play', args: []});
  player[playing ? 'pause' : 'play']();
  playing = !playing;
  $('#play').html(playing ? 'pause' : 'play_arrow');
});
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