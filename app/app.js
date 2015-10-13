var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var mm = require('musicmetadata');
var walk = require('./walk.js');

var static = require('node-static');

//Store file util functions
app.initStore = function() {
  store = {
    musicDir: '',
    albums: {},
    playlists: {},
    fsState: []
  };
};

app.newPlaylist = function(title) {
  store.playlists.push({
    title: title,
    songs: {}
  });
};

app.writeStore = function() {
  fs.writeFileSync(sonioDir + storeDir, JSON.stringify(store));
};

app.scanDir = function() {
  windows[0].webContents.send('showScreen', 'LoadingScreen');
  walk(store.musicDir, function(err, res) {
    if (err) {
      console.log(err);
    }
    if (JSON.stringify(store.fsState) !== JSON.stringify(res)) {
      console.log('Refreshing library meta index...');
      var streams = [];
      var fileCount = 0;
      var fileReadCount = 0;
      for (var k in res) {
        //supported formats
        if (res[k].endsWith('.flac')) {
          fileCount++;
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
              var album = store.albums[metadata.album];
              var index = metadata.track.no;
              if (album.tracks[metadata.track.no] != null) {
                index = album.tracks.length;
                album.tracks[album.tracks.length] = {};
              }
              album.tracks[index] = {};
              album.tracks[index].meta = metadata;
              album.tracks[index].url = encodeURI(fileUrl.replace(store.musicDir + '/', ''));
              fileReadCount++;
            });
          })(res[k]);
        }
      }
      var waitForMeta = setInterval(function() {
        console.log('Waiting for meta index...', fileReadCount + '/' + fileCount);
        if (fileReadCount >= fileCount) {
          console.log('Clearing meta streams...');
          for (var k in streams) {
            streams[k].close();
            streams[k] = null;
          }
          app.writeStore();
          windows[0].webContents.send('updateLibrary');
          clearInterval(waitForMeta);
        }
      }, 100);
    }
    else {
      windows[0].webContents.send('updateLibrary');
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

var musicServer = new static.Server(store.musicDir);
var http = require('http');
http.createServer(function(request, response) {
  request.addListener('end', function() {
    musicServer.serve(request, response);
  }).resume();
}).listen(49579);

var name = require('app').getName();
var menuTemplate = [{
  label: name,
  submenu: [
    {
      label: 'About ' + name,
      role: 'about'
    },
    {
      type: 'separator'
    },
    {
      label: 'Preferences...',
      accelerator: 'Command+,',
      click: function() {
        windows[0].webContents.send('showScreen', 'Settings');
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Services',
      role: 'services',
      submenu: []
    },
    {
      type: 'separator'
    },
    {
      label: 'Hide ' + name,
      accelerator: 'Command+H',
      role: 'hide'
    },
    {
      label: 'Hide Others',
      accelerator: 'Command+Shift+H',
      role: 'hideothers'
    },
    {
      label: 'Show All',
      role: 'unhide'
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function() { app.quit(); }
    }
  ]
}];

var Menu = require('menu');
var menu = Menu.buildFromTemplate(menuTemplate);

var windows = [];

app.on('window-all-closed', function() {
  app.quit();
});

process.on('SIGINT', function() {
  windows[0].hide();
  app.writeStore();
  process.exit();
});

app.on('will-quit', function() {
  windows[0].hide();
  app.writeStore();
});

app.on('ready', function() {
  console.log('Electron ready, starting BrowserWindow...');
  //Menu.setApplicationMenu(menu);
  windows[0] = new BrowserWindow({width: 1150, height: 750});

  windows[0].loadUrl('file://' + __dirname + '/browser/dist/index.html');
  windows[0].webContents.on('did-finish-load', function() {
    if (store.musicDir === '') {
      windows[0].webContents.send('showScreen', 'WelcomeScreen');
    }
    else {
      app.scanDir();
    }
  });
  windows[0].on('closed', function() {
    windows[0] = null;
  });
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
  event.sender.send('queryStoreRes', {data: store[arg], key: arg});
});

ipc.on('getStoreDir', function(event, arg) {
  event.returnValue = sonioDir + storeDir;
});

ipc.on('createPlaylist', function(event, title) {
  console.log('[createPlaylist]', arg);
  app.newPlaylist(arg);
});