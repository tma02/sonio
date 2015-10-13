var LeftNav = require('material-ui/lib/left-nav');
var MenuItem = require('material-ui/lib/menu/menu-item');


module.exports = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      menuItems: [
        { type: MenuItem.Types.SUBHEADER, text: 'Library' },
        { route: 'AlbumsView', text: 'Albums' },
        { route: 'SongsView', text: 'Songs' },
        { route: 'ArtistsView', text: 'Artists' },
        { type: MenuItem.Types.SUBHEADER, text: 'Playlists' },
        { route: 'NewPlaylist', text: 'New Playlist' }
      ]
    };
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  addPlaylist: function(playlist) {
    this.state.menuItems.push({route: 'playlist-' + playlist.id, 'text': playlist.name});
  },

  onChange: function(e, selectedIndex, menuItem) {
    switch(menuItem.route) {
      case 'NewPlaylist':
        break;
      default:
        loadView(menuItem.route, null);
        break;
    }
  },

  render: function() {
    return (
      <LeftNav onChange={this.onChange} ref="leftNav" menuItems={this.state.menuItems} />
    );
  }
});