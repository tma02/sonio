var IconButton = require('material-ui/lib/icon-button');
var Slider = require('material-ui/lib/slider');
var FontIcon = require('material-ui/lib/font-icon');
const NO_REPEAT = 0;
const REPEAT_LIST = 1;
const REPEAT_SONG = 2;

module.exports = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },

  getInitialState: function() {
    return {
      coverUrl: static.imgs.blankCover,
      currentView: null,
      context: {},
      playedTracks: [],
      currentTrackNo: -1,
      album: '',
      title: '',
      artist: '',
      duration: 0,
      progress: 0,
      timeSpent: '0:00',
      timeRemaining: '0:00',
      shuffle: false,
      repeat: NO_REPEAT,
      volumeIcon: 'volume_up',
      volume: 100,
      playing: false
    };
  },

  handleShuffle: function() {
    this.setState({shuffle: !this.state.shuffle});
  },

  handleRepeat: function() {
    this.state.repeat++;
    this.state.repeat %= 3;
    //trigger render
    this.setState({repeat: this.state.repeat});
  },

  handleSkipBackward: function() {

  },

  handleSkipForward: function() {

  },

  handlePlay: function() {
    if (player === null) {
      return;
    }
    var state = this.state;
    this.setState({playing: !this.state.playing}, function() {
      util.easePlayPause(state);
    });
    //player[this.state.playing ? 'pause' : 'play']();
  },

  handleVolumeSlider: function(e, value) {
    if (value > 0.5) {
      this.setState({volumeIcon: 'volume_up'});
    }
    else if (value == 0) {
      this.setState({volumeIcon: 'volume_mute'});
    }
    else {
      this.setState({volumeIcon: 'volume_down'});
    }
    this.setState({volume: value * 100});
    player.volume = this.state.volume;
  },

  handleSeekSlider: function(e, value) {
    player.seek(value);
  },

  handleTrackEnd: function() {
    if (this.state.repeat == REPEAT_SONG) {
      loadTrackFromURL('http://localhost:49579/' + this.state.context.tracks[this.state.currentTrackNo].url, this, this.state.context);
      return;
    }
    var contextLength = Object.keys(this.state.context.tracks).length;
    if (this.state.currentTrackNo >= contextLength || this.state.playedTracks.length >= contextLength) {
      console.log(contextLength);
      this.setState({currentTrackNo: 1})
      this.setState({playing: this.state.repeat == REPEAT_LIST, playedTracks: []});
    }
    else if (!this.state.shuffle) {
      this.setState({currentTrackNo: this.state.currentTrackNo + 1});
    }
    else if (this.state.shuffle) {
      var trackNo = Math.ceil(Math.random() * contextLength);
      while (this.state.playedTracks.indexOf(trackNo) != -1) {
        trackNo = Math.ceil(Math.random() * contextLength);
      }
      this.setState({currentTrackNo: trackNo});
    }
    loadTrackFromURL('http://localhost:49579/' + this.state.context.tracks[this.state.currentTrackNo].url, this, this.state.context);
    this.state.currentView.highlightPlayingCell();
  },
  
  render: function() {
    if (this.state.currentView != null && this.state.context.meta != null && this.state.currentView.props.args === this.state.context.meta.name) {
      this.state.currentView.highlightPlayingCell();
    }
    var coverStyles = {
      'width': '120px',
      'height': '120px',
      'display': 'inline-block',
      'verticalAlign': 'top'
    };
    var containerStyles = {
      'width': 'calc(100% - 164px)',
      'padding': '0 22px 0 22px',
      'display': 'inline-block',
      'verticalAlign': 'top'
    };
    var titleStyles = {
      'fontSize': '12px',
      'marginTop': '8px',
      'textAlign': 'center',
      'marginBottom': '-20px'
    };
    var timeStyles = {
      'fontSize': '12px',
      'marginTop': '-48px',
      'marginBottom': '36px'
    };
    var buttonContainerStyles = {
      'padding': '0',
      'marginLeft': '36px',
      'marginTop': '-38px',
      'textAlign': 'center'
    };
    var buttonIconStyles = {
      'fontSize': '48px',
      'marginTop': '-12px',
      'marginLeft': '-12px'
    };
    var toggleIconStyles = {
      'position': 'relative',
      'top': '-12px'
    };
    var volumeSliderStyles = {
      'width': '100px',
      'display': 'inline-block',
      'margin': '0',
      'marginTop': '-48px',
      'float': 'right'
    };

    var playBtn = this.state.playing ? 'pause' : 'play_arrow';

    var remainingSecs = Math.floor((this.state.duration - this.state.progress) / 1000);
    this.state.timeRemaining = util.secondsToString(remainingSecs);
    var progressSecs = Math.floor(this.state.progress / 1000);
    this.state.timeSpent = util.secondsToString(progressSecs);

    var repeatBtn = this.state.repeat === REPEAT_SONG ? 'repeat_one' : 'repeat';

    return (
      <div style={{'overflow': 'hidden'}}>
        <div style={coverStyles}>
          <img src={this.state.coverUrl} width={120} height={120} />
        </div>
        <div style={containerStyles}>
          <div style={titleStyles}>
            <span><b>{this.state.title}</b> - {this.state.artist}</span>
          </div>
          <Slider onChange={this.handleSeekSlider} name="skip" value={this.state.progress} max={this.state.duration}/>
          <div style={timeStyles}>
            <span>{this.state.timeSpent}</span>
            <span style={{'float': 'right'}}>-{this.state.timeRemaining}</span>
          </div>
          <div style={buttonContainerStyles}>
            <IconButton onClick={this.handleShuffle} style={toggleIconStyles} iconStyle={{'color': this.state.shuffle ? '#000' : '#aaa'}} iconClassName="material-icons">
              shuffle
            </IconButton>
            <IconButton onClick={this.handleSkipBackward} iconStyle={buttonIconStyles} iconClassName="material-icons">
              skip_previous
            </IconButton>
            <IconButton onClick={this.handlePlay} iconStyle={buttonIconStyles} iconClassName="material-icons">
              {playBtn}
            </IconButton>
            <IconButton onClick={this.handleSkipForward} iconStyle={buttonIconStyles} iconClassName="material-icons">
              skip_next
            </IconButton>
            <IconButton onClick={this.handleRepeat} style={toggleIconStyles} iconStyle={{'color': this.state.repeat !== 0 ? '#000' : '#aaa'}} iconClassName="material-icons">
              {repeatBtn}
            </IconButton>
            <IconButton style={toggleIconStyles} iconStyle={{'color': this.state.repeat !== 0 ? '#000' : '#aaa'}} iconClassName="material-icons">
              fullscreen
            </IconButton>
          </div>
          <div style={volumeSliderStyles}>
            <FontIcon className="material-icons">{this.state.volumeIcon}</FontIcon>
            <Slider onChange={this.handleVolumeSlider} style={{'width': '64px', 'display': 'inline-block', 'margin': '0 0 2px 6px'}} name="volume" defaultValue={1} />
          </div>
        </div>
      </div>);
  }
});