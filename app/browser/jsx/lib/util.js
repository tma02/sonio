module.exports = {
  arrayBufferDataUri: function(raw) {
    //https://jsperf.com/encoding-xhr-image-data/51
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
  },

  secondsToString: function(secs) {
    var hours = Math.floor(secs / 3600);
    var minutes = Math.floor(secs / 60) - (hours * 60);
    var seconds = Math.round(secs % 60);
    var str = '';
    if (hours > 0) {
      str += Math.floor(secs / 3600) + ':';
      if (minutes < 10) {
        str += '0';
      }
    }
    str += minutes + ':'
    if (seconds < 10) {
      str += '0';
    }
    str += seconds;
    return str;
  },

  getAlbumArtist: function(album) {
    /*if (album.meta.artist.length != 0) {
      return album.meta.artist[0];
    }
    else {*/
      return album.tracks[1].meta.artist[0];
    //}
  },

  easePlayPause: function(state) {
    var t = 0;
    var easeOutQuad = function(t) {return t*(2-t)};
    var easeVolume = setInterval(function() {
      if (!state.playing) {
        player.play();
      }
      if (t >= 1) {
        if (state.playing)
          player.pause();
        clearInterval(easeVolume);
      }
      var volume = easeOutQuad(t+=0.03) * state.volume;
      if (!state.playing) {
        player.volume = volume;
      }
      else {
        player.volume = state.volume - volume;
      }
    }, 10);
  },

  getNextTrackIndex: function(context, index) {

  }
};