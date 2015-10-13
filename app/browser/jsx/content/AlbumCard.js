var Card = require('material-ui/lib/card/card');
var CardMedia = require('material-ui/lib/card/card-media');
var CardTitle = require('material-ui/lib/card/card-title');

var AlbumCard = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  onClick: function() {
    loadView('AlbumView', this.props.title);
  },

  render: function() {
    var componentStyles = {
      'width': '200px',
      'height': '350px',
      'display': 'inline-block',
      'margin': '8px',
      'textAlign': 'left',
      'cursor': 'pointer'
    };
    return (
      <Card onClick={this.onClick} style={componentStyles} initiallyExpanded={true}>
        <CardMedia>
          <img src={this.props.cover}/>
        </CardMedia>
        <CardTitle style={{'background': '#F5F5F5', 'height': '150px'}} title={this.props.title} subtitle={this.props.artist}/>
      </Card>);
  }
});

module.exports = AlbumCard;