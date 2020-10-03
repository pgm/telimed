import React from "react";
import "./App.css";
import { LocalTracks } from "./LocalTracks";
import _ from "lodash";
import { Settings } from "./Settings";
import { Video } from "./Video";
// props: jitsi
export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedSpeakerDeviceId: "",
      defaultAudioInput: "",
      defaultAudioOutput: "",
      defaultVideoInput: "",
      deviceList: [],
      status: "closed",
      lastError: "",
      remoteTrackIds: [],
      loaded: false,
      activeRoomId: null,
    };
  }

  componentDidMount() {
    const { jitsi } = this.props;

    jitsi.enumerateDevices().then((devices) => {
      let newDeviceList = [];
      for (let device of devices) {
        // if (device.deviceId !== 'default' && device.deviceId !== 'communications') {
        newDeviceList.push({
          name: device.label,
          id: device.deviceId,
          type: device.kind,
        });
        // }
      }

      let defaultAudioInput =
        (_.find(newDeviceList, { type: "audioinput" }) || {}).id || "none";
      let defaultVideoInput =
        (_.find(newDeviceList, { type: "videoinput" }) || {}).id || "none";
      let defaultAudioOutput =
        (_.find(newDeviceList, { type: "audiooutput" }) || {}).id || "none";

      console.log("newDeviceList", newDeviceList);
      this.setState({
        deviceList: newDeviceList,
        defaultAudioInput: defaultAudioInput,
        defaultVideoInput: defaultVideoInput,
        defaultAudioOutput: defaultAudioOutput,
        loaded: true,
      });
    });
  }

  onSpeakerChanged = (newSpeakerId) => {
    this.setState({
      selectedSpeakerDeviceId: newSpeakerId,
    });
    // call setAudioOutput on all remote tracks
  };

  onRoomTracksChanged = (remoteTracks) => {
    this.setState({
      remoteTracks: remoteTracks,
    });
  };

  onConnect = () => {
    const { roomId } = this.props;
    this.setState({
      status: "Joining...",
    });
    this.jitsi
      .connect(roomId)
      .then(() => {
        this.setState({
          status: "open",
          lastError: "",
          activeRoomId: roomId,
        });
      })
      .catch((error) => {
        this.setState({
          status: "closed",
          activeRoomId: null,
          lastError: error,
        });
      });
  };

  onDisconnect = () => {
    this.setState({
      status: "Leaving...",
    });

    this.state.jitsi.disconnect().then(() => {
      this.setState({
        status: "closed",
        activeRoomId: null,
      });
    });
  };

  renderRemoteTracks = (remoteTracks) => {
    let remoteTracksByParticipant = _.groupBy(remoteTracks, (rt) => {
      return rt.participantId;
    });

    // maybe add a sort here
    let participantIds = _.keys(remoteTracksByParticipant);
    if (participantIds.length === 0) {
      return [];
    }

    let ret = [];
    for (let participantId of participantIds) {
      let tracks = remoteTracksByParticipant[participantId];

      let audio = _.find(tracks, (track) => track.getType() == "audio");
      let video = _.find(tracks, (track) => track.getType() == "video");

      ret.push(
        <div key={participantId} className="B_Body_Block">
          <Video videoTrack={video} audioTrack={audio} />
        </div>
      );
    }

    return ret;
  };

  render() {
    const {
      selectedSpeakerDeviceId,
      status,
      lastError,
      defaultMicId,
      defaultVideoId,
      defaultSpeakerId,
      deviceList,
      loaded = false,
      remoteTracks = [],
      activeRoomId,
    } = this.state;

    if (loaded === false) {
      return (
        <div className="App">
          <div className="AppLoading">
            <h3>Loading...</h3>
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <div className="TL">
          <div>
            {status === "closed" ? (
              <button onClick={this.onConnect}>Connect</button>
            ) : status === "open" ? (
              <button onClick={this.onDisconnect}>Disconnect</button>
            ) : (
              <button disabled={true}>{status}</button>
            )}
          </div>
          <Settings
            deviceList={deviceList}
            key="LocalSpeaker"
            defaultSpeakerId={defaultSpeakerId}
            onAudioOutputChange={this.onSpeakerChanged}
          />
          <div>{lastError}</div>
        </div>
        <div className="TR">
          <div className="TR_Header">
            <h3>Me</h3>
          </div>
          <div class="TR_Body">
            <div className="TR_Body_Block">
              <LocalTracks
                jitsiController={this.props.jitsiController}
                activeRoomId={activeRoomId}
                deviceList={deviceList}
                defaultMicId={defaultMicId}
                defaultVideoId={defaultVideoId}
                key="localTracks"
              />
            </div>
          </div>
        </div>
        <div className="B">
          <div className="B_Header">
            <h3>Them</h3>
          </div>
          <div className="B_Body">{this.renderRemoteTracks(remoteTracks)}</div>
        </div>
      </div>
    );
  }
}
