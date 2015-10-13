var Table = require('material-ui/lib/table/table');
var TableHeader = require('material-ui/lib/table/table-header');
var TableRow = require('material-ui/lib/table/table-row');
var TableHeaderColumn = require('material-ui/lib/table/table-header-column');
var TableBody = require('material-ui/lib/table/table-body');
var TableRowColumn = require('material-ui/lib/table/table-row-column');

var AlbumView = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  onCellClick: function(r, c) {
    var self = this;
    window.controls.setState({playing: true, currentTrackNo: r + 1}, function() {
      loadTrackFromURL('http://localhost:49579/' + store.albums[self.props.args].tracks[r + 1].url, window.controls, store.albums[self.props.args]);
      self.highlightPlayingCell();
    });
  },

  highlightPlayingCell: function() {
    $('.mui-table-row').css('background', '#FFF');
    $('#' + window.controls.state.currentTrackNo).css('background', '#F5F5F5');
  },

  render: function() {
    return (
      <Table
        height={'100%'}
        fixedHeader={true}
        fixedFooter={false}
        selectable={false}
        multiSelectable={false}
        onCellClick={this.onCellClick}
      >
        <TableHeader displaySelectAll={false} adjustForCheckbox={false} >
          <TableRow>
            <TableHeaderColumn>#</TableHeaderColumn>
            <TableHeaderColumn>Title</TableHeaderColumn>
            <TableHeaderColumn>Artist</TableHeaderColumn>
            <TableHeaderColumn>Duration</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {
            (function(title) {
              var tracks = store.albums[title].tracks;
              var display = [];
              for (var i in tracks) {
                var rowStyles = {};
                display.push(
                  <TableRow hoverable={true} id={i}>
                    <TableRowColumn>{i}</TableRowColumn>
                    <TableRowColumn>{tracks[i].meta.title}</TableRowColumn>
                    <TableRowColumn>{tracks[i].meta.artist[0]}</TableRowColumn>
                    <TableRowColumn>{util.secondsToString(tracks[i].meta.duration)}</TableRowColumn>
                  </TableRow>
                );
              }
              return display;
            })(this.props.args)
          }
        </TableBody>
      </Table>
    );
  }
});

module.exports = AlbumView;