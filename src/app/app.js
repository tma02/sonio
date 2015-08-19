var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var ipc = require('ipc');
var static = require('node-static');
var AV = require('av');
require('flac.js');

var fileServer = new static.Server('/Users/tma/Music/');

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response);
  }).resume();
}).listen(49579);

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

ipc.on('getFileBuffer', function(event, arg) {
	console.log('[getFileBuffer]', arg);
	event.returnValue = fs.readFileSync(arg);
});