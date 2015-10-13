var FlatButton = require('material-ui/lib/flat-button');

var WelcomeScreen = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  browse: function() {
    $('#browse').attr('webkitdirectory', '');
    $('input[type=file]').change(function () {
      ipc.send('updateStore', {key: 'musicDir', val: this.files[0].path});
    });
    $('#browse').trigger('click');
  },

  render: function() {
    var screenStyles = {
      'position': 'absolute',
      'top': '0',
      'left': '0',
      'width': '100vw',
      'height': '100vh',
      'zIndex': '100',
      'background': '#FCFCFC',
      'color': '#B8C6D0',
      'textAlign': 'center',
      'overflow': 'hidden'
    };
    var buttonStyles = {
      'marginTop': '24px'
    };
    return (
      <div style={screenStyles}>
        <div style={{'fontSize': '84px', 'textTransform': 'uppercase', 'marginTop': '200px'}}>Welcome to sonio</div>
        <div style={{'fontSize': '32px', 'marginTop': '50px'}}>sonio needs to know where your music is.</div>
        <input style={{'display': 'none'}} type="file" id="browse" webkitdirectory />
        <FlatButton onClick={this.browse} style={buttonStyles} label="Browse" />
      </div>
    );
  }
});

module.exports = WelcomeScreen;