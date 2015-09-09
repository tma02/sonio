var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var static = require('node-static');
var mm = require('musicmetadata');
var walk = require('./walk.js');
var win;

//Store file util functions
app.initStore = function() {
  store = {
    musicDir: '',
    albums: {},
    playlists: {},
    fsState: [],
    disableTransparent: false
  };
};

app.newPlaylist = function(name) {
  store.playlists.push({
    name: name,
    songs: []
  });
};

app.writeStore = function() {
  fs.writeFileSync(sonioDir + storeDir, JSON.stringify(store));
};

app.scanDir = function() {
  win.webContents.send('showScreen', '/loading-screen');
  walk(store.musicDir, function(err, res) {
    if (err) {
      console.log(err);
    }
    if (JSON.stringify(store.fsState) != JSON.stringify(res)) {
      console.log('Refreshing library meta index...');
      var streams = [];
      var flacCount = 0;
      var flacReadCount = 0;
      for (var k in res) {
        if (res[k].endsWith('.flac')) {
          flacCount++;
        }
      }
      for (var k in res) {
        if (res[k].endsWith('.flac')) {
          (function(fileUrl) {
            mm(streams[streams.push(fs.createReadStream(fileUrl, {autoClose: true})) - 1], {duration: false}, function(err, metadata) {
              if (err) {
                console.log(err);
              }
              if (!store.albums.hasOwnProperty(metadata.album)) {
                store.albums[metadata.album] = {
                  tracks: {},
                  meta: {
                    name: metadata.album,
                    year: metadata.year,
                    artist: metadata.albumartist,
                    cover: ''
                  }
                };
              }
              store.albums[metadata.album].tracks[metadata.track.no] = {};
              store.albums[metadata.album].tracks[metadata.track.no].meta = metadata;
              store.albums[metadata.album].tracks[metadata.track.no].url = encodeURI(fileUrl.replace(store.musicDir + '/', ''));
              flacReadCount++;
            });
          })(res[k]);
        }
      }
      var waitForMeta = setInterval(function() {
        console.log('Waiting for meta index...', flacReadCount + '/' + flacCount);
        if (flacReadCount >= flacCount) {
          console.log('Clearing meta streams...');
          for (var k in streams) {
            streams[k].close();
          }
          win.webContents.send('updateLibrary');
          clearInterval(waitForMeta);
        }
      }, 100);
    }
    else {
      win.webContents.send('updateLibrary');
    }
    store.fsState = res;
    return res;
  });
}

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

//Start static file servers
var musicServer = new static.Server(store.musicDir);
var viewServer = new static.Server(__dirname + '/content/', {cache: false});

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
  win = new BrowserWindow({width: 1000, height: 600, transparent: !store.disableTransparent, frame: store.disableTransparent});
  win.loadUrl('file://' + __dirname + '/view.html');
  win.webContents.on('did-finish-load', function() {
    if (store.musicDir === '') {
      win.webContents.send('showScreen', '/welcome-screen');
    }
    else {
      app.scanDir();
    }
  });
  win.on('closed', function() {
    win = null;
  });
});

ipc.on('windowCtl', function(event, arg) {
  console.log('[windowCtl]', arg);
  win[arg.fn](arg.args);
});

ipc.on('updateStore', function(event, arg) {
  console.log('[updateStore]', arg);
  store[arg.key] = arg.val;
  if (arg.key == 'musicDir') {
    musicServer = new static.Server(store.musicDir);
    app.scanDir();
  }
});

ipc.on('queryStore', function(event, arg) {
  console.log('[queryStore]', arg);
  event.returnValue = store[arg];
});

ipc.on('createPlaylist', function(event, arg) {
  console.log('[createPlaylist]', arg);
  store.playlists.push(arg);
});