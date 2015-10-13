var AlbumCard = require('../content/albumcard.js');

var AlbumsView = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  getInitialState: function() {
    return {display: []};
  },

  render: function() {
    //TODO: Either render on seperate thread or move player to seperate thread to prevent unfilled device buffer.
    for (var i in store.albums) {
      /*if (store.fastAlbums[i].meta.cover !== '') {
        coverDataUri = static.arrayBufferDataUri(store.fastAlbums[i].meta.cover);
      }
      if (store.fastAlbums[i].meta.cover === '' && store.albums[i].tracks[1].meta.picture.length !== 0) {
        coverDataUri = static.arrayBufferDataUri(store.albums[i].tracks[1].meta.picture[0].data.data);
      }*/
      this.state.display.push(<AlbumCard cover={static.imgs.blankCover} title={store.albums[i].meta.name} artist={util.getAlbumArtist(store.albums[i])} />);
    }
    return (
      <div style={{'textAlign': 'center', 'verticalAlign': 'top'}}>
        <div style={{'textAlign': 'left', 'width': 'auto'}}>
          {this.state.display}
        </div>
      </div>);
  }
});

module.exports = AlbumsView;