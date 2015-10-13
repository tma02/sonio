var React = require('react');
var jquery = $ = require('jquery');
var remote = require('remote');
var mui = require('material-ui');
window.static = require('./lib/static.js');
window.util = require('./lib/util.js');
window.ipc = require('ipc');

var ThemeManager = new mui.Styles.ThemeManager();

window.AV = require('./lib/aurora.js');
require('./lib/flac.js');

require('./theme.js');
var Menu = require('./Menu.js');
var Controls = require('./Controls.js');

var views = {};
var AlbumsView = require('./views/AlbumsView.js');
views.AlbumsView = AlbumsView;
var AlbumView = require('./views/AlbumView.js');
views.AlbumView = AlbumView;

var screens = {};
var WelcomeScreen = require('./screens/WelcomeScreen.js');
screens.WelcomeScreen = WelcomeScreen;
var LoadingScreen = require('./screens/LoadingScreen.js');
screens.LoadingScreen = LoadingScreen;

window.store = {};

window.player = null;
window.loadTrackFromURL = function(url, controls, context) {
  if (player !== null) {
    player.stop();
    player = null;
  }
  player = AV.Player.fromURL(url);
  player.controls = controls;
  player.volume = player.controls.state.volume;
  player.controls.setState({context: context});
  player.on('metadata', function(obj) {
    player.controls.setState({title: obj.title, artist: obj.artist, album: obj.album});
  });
  player.on('duration', function(duration) {
    player.controls.setState({duration: duration});
  });
  player.on('progress', function(progress) {
    player.controls.setState({progress: progress});
  });
  player.on('end', function() {
    player.controls.handleTrackEnd();
  });
  if (player.controls.state.playing) {
    player.play();
  }
  else {
    player.preload();
  }
}

window.loadView = function(view, args) {
  window.controls.setState({currentView: React.render(React.createElement(views[view], {args}), document.getElementById('content'))});
  document.getElementById('content').scrollTop = 0;
}

//Can go away when react 1.0 release
require('react-tap-event-plugin')();

React.render(React.createElement(screens['LoadingScreen'], {message: 'Synchronizing your library...'}), document.getElementById('screen'));
React.render(<Menu />, document.getElementById('menu'));
//React.render(<AlbumsView args={{}}/>, document.getElementById('content'));
window.controls = React.render(<Controls />, document.getElementById('controls'));

ipc.on('showScreen', function(title) {
  React.render(React.createElement(screens[title], {message: 'Synchronizing your library...'}), document.getElementById('screen'));
  $('#screen').css('display', 'inherit');
});

ipc.on('updateLibrary', function() {
  store = require(ipc.sendSync('getStoreDir'));
  $('#screen').css('display', 'none');
  React.render(<AlbumsView args={{}}/>, document.getElementById('content'));
});