import React from "react";
import { JitsiRoom, LocalFeed } from "./JitsiRoom";
import { Video } from "./Video";
import _ from "lodash";

export default {
  title: "Components/JitsiRoom",
  //component: JitsiRoom,
};

class Wrapper extends React.Component {
  //    const lf = new LocalFeed()
  //    lf.on("videoChanged", )
  constructor(props) {
    super(props);
    this.state = { last: "starting", remoteTracks: [] };
  }

  componentDidMount() {
    this.setState({ last: "mounted", localVideo: null, localAudio: null });
    const localFeed = new LocalFeed();
    localFeed.on("devicesChanged", () => console.log("devicesChanged"));

    const jitsi = new JitsiRoom("beta.meet.jit.si");

    jitsi.on("roomTracksChanged", (tracks) => {
      console.log("roomTracksChanged", tracks);
      this.setState({ remoteTracks: tracks });
    });

    localFeed.on("videoChanged", (track) => {
      console.log("videoChanged", track);
      jitsi.setLocalVideoTrack(track);
      this.setState({ localVideo: track });
    });

    localFeed.on("audioChanged", (track) => {
      console.log("audioChanged", track);
      jitsi.setLocalAudioTrack(track);
      this.setState({ localAudio: track });
    });

    localFeed.initDevices().then(() => {
      console.log("initDevices complete");

      jitsi.connect("pgmtest").then(() => console.log("connect completed"));
    });
  }

  renderRemoteTracks = (remoteTracks) => {
    let remoteTracksByParticipant = _.groupBy(remoteTracks, (rt) => {
      return rt.participantId;
    });

    let participantIds = _.keys(remoteTracksByParticipant);
    participantIds.sort();

    let ret = [];
    for (let participantId of participantIds) {
      let tracks = remoteTracksByParticipant[participantId];

      let audio = _.find(tracks, { type: "audio" }) || { track: null };
      let video = _.find(tracks, { type: "video" }) || { track: null };

      console.log("track!", tracks, audio, video);

      ret.push(
        <div key={participantId}>
          <Video videoTrack={video.track} audioTrack={audio.track} />
        </div>
      );
    }

    return ret;
  };

  render() {
    return (
      <div>
        <p>{this.state.last}</p>
        <Video
          videoTrack={this.state.localVideo}
          //   audioTrack={this.state.localAudio}
        />

        {this.renderRemoteTracks(this.state.remoteTracks)}

        {this.state.remoteTracks.map((track, i) => {
          return (
            <div key={i}>
              {track.participantId} {track.type}
            </div>
          );
        })}
      </div>
    );
  }
}

/**
 * Primary UI component for user interaction
 */
export const JitsiRoomTest = () => {
  return <Wrapper />;
};
