var Table = require('material-ui/lib/table');

var LoadingScreen = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
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
    return (
      <div style={screenStyles}>
        <div style={{'fontSize': '84px', 'textTransform': 'uppercase', 'marginTop': '200px'}}>Please wait</div>
        <div style={{'fontSize': '32px', 'marginTop': '50px'}}>{this.props.message}</div>
      </div>
    );
  }
});

module.exports = LoadingScreen;