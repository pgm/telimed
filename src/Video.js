import React from "react";
// import _ from "lodash";
// import { componentGetCompareProps } from "./Shared";
import "./RemoteTrack.css";

// props: videoTrack, audioTrack
export class Video extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.audioRef = React.createRef();
  }

  componentDidMount() {
    const { videoTrack, audioTrack } = this.props;

    if (audioTrack) {
      audioTrack.attach(this.audioRef.current);
    }
    if (videoTrack) {
      videoTrack.attach(this.videoRef.current);
    }
  }

  componentWillUnmount() {
    const { videoTrack, audioTrack } = this.props;

    if (audioTrack) {
      audioTrack.detach(this.audioRef.current);
    }
    if (videoTrack) {
      videoTrack.detach(this.videoRef.current);
    }
  }

  componentDidUpdate(prevProps) {
    const { videoTrack, audioTrack } = this.props;
    const { prevVideoTrack, prevAudioTrack } = prevProps;

    if (prevVideoTrack !== videoTrack) {
      if (prevVideoTrack) {
        prevVideoTrack.detach(this.videoRef.current);
      }
      videoTrack.attach(this.videoRef.current);
    }

    if (prevAudioTrack !== audioTrack) {
      if (prevAudioTrack) {
        prevAudioTrack.detach(this.audioRef.current);
      }
      audioTrack.attach(this.audioRef.current);
    }
  }

  render() {
    return (
      <div class="remote_track">
        <div class="remote_track_controls">
          <span>???</span>
        </div>
        <div class="remote_track_body">
          <video autoPlay="1" ref={this.videoRef} />
        </div>
        <div>
          <audio autoPlay="1" ref={this.audioRef} />
        </div>
      </div>
    );
  }
}
