import React from "react";
import "./App.css";
import { LocalTracks } from "./LocalTracks";
import _ from "lodash";
// import { RemoteTrack } from "./RemoteTrack";
// import { v4 as uuidv4 } from "uuid";
import { Settings } from "./Settings";

class JistiStuff {
  constructor(serverURL) {
    this.serverURL = serverURL;
    this.remoteTracks = [];
    this.onRoomTracksChanged = [];
  }

  enumerateDevices() {
    const promise = new Promise((resolve, reject) => {
      window.JitsiMeetJS.mediaDevices.enumerateDevices((devices) =>
        resolve(devices)
      );
    });

    return promise;
  }

  disconnect() {
    return this.activeRoom.leave().then(() => {
      if (this.activeConnection) {
        this.activeConnection.disconnect();
      }
    });
  }

  connect(roomId) {
    this.activeConnection = new window.JitsiMeetJS.JitsiConnection(null, null, {
      hosts: {
        domain: this.serverURL,
        muc: `conference.${this.serverURL}`, // FIXME: use XEP-0030
      },
      serviceUrl: `wss://${this.serverURL}/xmpp-websocket?room=${roomId}`,
      clientNode: `https://${this.serverURL}`,
    });

    const promise = new Promise((resolve, reject) => {
      // onConnectionSuccess = () => {
      //   const { roomId } = this.props;
      //   this.activeRoom = this.activeConnection.initJitsiConference(roomId, {
      //     openBridgeChannel: true,
      //   });
      //   this.activeRoom.addEventListener(
      //     window.JitsiMeetJS.events.conference.TRACK_ADDED,
      //     this.onRoomTrackAdded
      //   );
      //   this.activeRoom.addEventListener(
      //     window.JitsiMeetJS.events.conference.TRACK_REMOVED,
      //     this.onRoomTrackRemoved
      //   );
      //   this.activeRoom.join();
      //   resolve();
      // };
      // onConnectionDisconnect = () => {
      //   this.props.jitsiController.activeConnection.removeEventListener(
      //     window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      //     this.onConnectionSuccess
      //   );
      //   this.props.jitsiController.activeConnection.removeEventListener(
      //     window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      //     this.onConnectionFailed
      //   );
      //   this.props.jitsiController.activeConnection.removeEventListener(
      //     window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      //     this.onConnectionDisconnect
      //   );
      //   this.props.jitsiController.activeRoom.removeEventListener(
      //     window.JitsiMeetJS.events.conference.TRACK_ADDED,
      //     this.onRoomTrackAdded
      //   );
      //   this.props.jitsiController.activeRoom.removeEventListener(
      //     window.JitsiMeetJS.events.conference.TRACK_REMOVED,
      //     this.onRoomTrackRemoved
      //   );
      // };
      // onConnectionFailed = (a, b, c, d) => {
      //   reject(a);
      // };
      // this.activeConnection.addEventListener(
      //   window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      //   onConnectionSuccess
      // );
      // this.activeConnection.addEventListener(
      //   window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      //   onConnectionFailed
      // );
      // this.activeConnection.addEventListener(
      //   window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      //   this.onConnectionDisconnect
      // );
      // this.activeConnection.connect();
    });

    return promise;
  }

  fireRoomTracksChanged = () => {
    // remoteTrackIds = _.map(this.props.jitsiController.remoteTracks, (rt) => {
    //   return { id: rt.id, participantId: rt.participantId };
    // });
    // _.forEach(this.onRoomTracksChanged, (listener) => listener(remoteTrackIds));
  };

  onRoomTrackAdded = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let newTrackId = track.getId();
    console.log(`Track Added: ${newTrackId}`);
    let matchTrack = _.find(this.remoteTracks, { id: newTrackId });
    if (matchTrack) {
      return;
    }
    let trackInfo = {
      id: newTrackId,
      participantId: track.getParticipantId(),
      type: track.getType(),
      track: track,
    };
    this.remoteTracks.push(trackInfo);

    this.fireRoomTracksChanged();
  };

  onRoomTrackRemoved = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let trackId = track.getId();
    this.props.jitsiController.remoteTracks = _.reject(
      this.props.jitsiController.remoteTracks,
      { id: trackId }
    );

    this.fireRoomTracksChanged();
  };
}

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jitsi: JistiStuff(this.props.serverURL),
      selectedSpeakerDeviceId: "",
      defaultMicId: "",
      defaultVideoId: "",
      defaultSpeakerId: "",
      deviceList: [],
      status: "closed",
      lastError: "",
      remoteTrackIds: [],
      loaded: false,
      activeRoomId: null,
    };
  }

  componentDidMount() {
    this.jitsi.enumerateDevices().then((devices) => {
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
      let micId =
        (_.find(newDeviceList, { type: "audioinput" }) || {}).id || "none";
      let videoId =
        (_.find(newDeviceList, { type: "videoinput" }) || {}).id || "none";
      let speakerId =
        (_.find(newDeviceList, { type: "audiooutput" }) || {}).id || "none";
      console.log("newDeviceList", newDeviceList);
      this.setState({
        deviceList: newDeviceList,
        defaultMicId: micId,
        defaultVideoId: videoId,
        defaultSpeakerId: speakerId,
        loaded: true,
      });
    });
  }

  componentDidUpdate() {}

  onSpeakerChanged = (newSpeakerId) => {
    this.setState({
      selectedSpeakerDeviceId: newSpeakerId,
    });
  };

  onRoomTracksChanged = (remoteTrackIds) => {
    this.setState({
      remoteTrackIds: remoteTrackIds,
    });
  };

  onConnect = () => {
    const { roomId } = this.props;
    this.setState({
      status: "Joining...",
    });
    this.state.jitsi
      .connect()
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
    if (this.state.activeRoomId) {
      this.setState({
        status: "Leaving...",
      });

      this.state.jitsi.disconnect().then(() => {
        this.setState({
          status: "closed",
          activeRoomId: null,
        });
      });
    }
  };

  renderRemoteTracks = (trackGroups = {}, selectedSpeakerDeviceId) => {
    let ret = [];

    let participantIds = _.keys(trackGroups);

    if (participantIds.length === 0) {
      return null;
    }
    for (let participantId of participantIds) {
      ret.push(
        <div key={participantId} className="B_Body_Block">
          {/* <RemoteTrack
            jitsiController={this.props.jitsiController}
            trackIds={trackGroups[participantId]}
            selectedSpeakerDeviceId={selectedSpeakerDeviceId}
          /> */}
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
      remoteTrackIds = [],
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

    let remoteTrackGroups = _.groupBy(remoteTrackIds, (rt) => {
      return rt.participantId;
    });

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
          <div className="B_Body">
            {this.renderRemoteTracks(
              remoteTrackGroups,
              selectedSpeakerDeviceId
            )}
          </div>
        </div>
      </div>
    );
  }
}
