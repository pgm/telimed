import React from "react";
import _ from "lodash";
import { Video } from "./Video";

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
    window.JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] }).then(
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
    } else {
      return (
        <Video
          videoTrack={this.state.videoTrack}
          audioTrackId={this.state.audioTrack}
        />
      );
    }
  }
}

/**
 * Primary UI component for user interaction
 */
export const LocalVideo = () => {
  return <VideoWrapper></VideoWrapper>;
};
