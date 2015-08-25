var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var static = require('node-static');
var win;

//Start static file servers
var musicServer = new static.Server('/Users/tma/Music/');
var viewServer = new static.Server(__dirname + '/views/', {cache: false});

var http = require('http');
http.createServer(function(request, response) {
  request.addListener('end', function() {
    musicServer.serve(request, response);
  }).resume();
}).listen(49579);
http.createServer(function(request, response) {
  request.addListener('end', function() {
    viewServer.serve(request, response);
  }).resume();
}).listen(49580);

//Store file util functions
app.initStore = function() {
  store = {
    musicDir: '',
    albums: {},
    playlists: {}
  };
};

app.newPlaylist = function(name) {
  store.playlists.push({
    name: name,
    songs: []
  });
};

app.scanDir = function(dir) {

};

app.writeStore = function() {
  fs.writeFileSync(sonioDir + storeDir, JSON.stringify(store));
};

//Read store file
var fs = require('fs');
var sonioDir = app.getPath('userData');
if (!fs.existsSync(sonioDir)){
  fs.mkdirSync(sonioDir);
}
var storeDir = '/store.json';
fs.closeSync(fs.openSync(sonioDir + storeDir, 'a'));
try {
  var store = require(sonioDir + storeDir);
}
catch (e) {
  console.log('No store file, creating...');
  console.log(e);
  var store = {};
  app.initStore();
}

//Handle app events
app.on('window-all-closed', function() {
  app.quit();
});

process.on('SIGINT', function() {
  app.writeStore();
  process.exit();
});

app.on('will-quit', function() {
  app.writeStore();
});

app.on('ready', function() {
  win = new BrowserWindow({width: 1000, height: 600, transparent: true, frame: false});
  win.loadUrl('file://' + __dirname + '/view.html');
  if (store.musicDir === '') {
    //TODO: dialog to set music dir
  }
  win.on('closed', function() {
    win = null;
  });
});

ipc.on('windowCtl', function(event, arg) {
  console.log('[windowCtl]', arg);
  win[arg.fn](arg.args);
});

ipc.on('scanDir', function(event, arg) {

});

