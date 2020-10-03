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
      console.log("Attaching audio 1");
    }
    if (videoTrack) {
      videoTrack.attach(this.videoRef.current);
      console.log("Attaching video 1");
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
      if (videoTrack) {
        videoTrack.attach(this.videoRef.current);
        console.log("Attaching video 1");
      }
    }

    if (prevAudioTrack !== audioTrack) {
      if (prevAudioTrack) {
        prevAudioTrack.detach(this.audioRef.current);
      }
      if (audioTrack) {
        audioTrack.attach(this.audioRef.current);
        console.log("Attaching audio 1");
      }
    }
  }

  render() {
    return (
      <div>
        <div>
          <span>???</span>
        </div>
        <div>
          <video autoPlay="1" ref={this.videoRef} style={{ width: "200px" }} />
        </div>
        <div>
          <audio autoPlay="1" ref={this.audioRef} />
        </div>
      </div>
    );
  }
}
