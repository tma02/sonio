var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var static = require('node-static');

var musicServer = new static.Server('/Users/tma/Music/');
var viewServer = new static.Server(__dirname + '/views/', {cache: false});

require('http').createServer(function(request, response) {
  request.addListener('end', function() {
    musicServer.serve(request, response);
  }).resume();
}).listen(49579);

require('http').createServer(function(request, response) {
  request.addListener('end', function() {
    viewServer.serve(request, response);
  }).resume();
}).listen(49580);

var win;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  win = new BrowserWindow({width: 1000, height: 600, transparent: true, frame: false});
  win.loadUrl('file://' + __dirname + '/view.html');
  win.on('closed', function() {
    win = null;
  });
});

ipc.on('windowCtl', function(event, arg) {
  console.log('[windowCtl]', arg);
  win[arg.fn](arg.args);
});