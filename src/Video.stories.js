import React from "react";
import _ from "lodash";
import { Video, VideoStrip } from "./Video";

export default {
  title: "Components/Video",
  component: Video,
};

class VideoWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loaded: false };
  }

  componentDidMount() {
    window.JitsiMeetJS.init({});
    window.JitsiMeetJS.createLocalTracks({ devices: ["video"] }).then(
      (tracks) => {
        console.log("tracks", tracks);
        const videoTrack = _.find(tracks, { type: "video" });
        const audioTrack = _.find(tracks, { type: "audio" });
        this.setState({
          videoTrack: videoTrack,
          audioTrack: audioTrack,
          loaded: true,
        });
      }
    );
  }

  render() {
    if (!this.state.loaded) {
      return <p>Loading</p>;
    }
    if (this.props.mode == "videostrip") {
      const videos = [
        { videoTrack: this.state.videoTrack, label: "Frank" },
        { videoTrack: this.state.videoTrack, label: "Steve" },
        { videoTrack: this.state.videoTrack, label: "Mary" },
      ];
      return (
        <VideoStrip videos={videos}>
          <div className="video-controls">
            <button>⚙️</button>
            <button>🎤</button>
          </div>
        </VideoStrip>
      );
    } else {
      return (
        <Video
          videoTrack={this.state.videoTrack}
          audioTrackId={this.state.audioTrack}
          label={"Me"}
        />
      );
    }
  }
}

export const SingleVideo = () => {
  return <VideoWrapper></VideoWrapper>;
};

export const VideoStripDemo = () => {
  return <VideoWrapper mode="videostrip"></VideoWrapper>;
};
