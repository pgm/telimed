import React from "react";
import "./App.css";
import { LocalTracks } from "./LocalTracks";
import { LocalSpeaker } from "./LocalSpeaker";
import _ from "lodash";
import { RemoteTrack } from "./RemoteTrack";
import { v4 as uuidv4 } from "uuid";

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      serverURL: "beta.meet.jit.si",
      roomId: "pgmtest",
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
    window.JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
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

  onSpeakerChanged = (newSpeaker) => {
    this.setState({
      selectedSpeakerDeviceId: newSpeaker.id,
    });
  };

  onServerChanged = (event) => {
    this.setState({
      serverURL: event.target.value,
    });
  };

  onRoomChanged = (event) => {
    this.setState({
      roomId: event.target.value,
    });
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
    this.props.jitsiController.remoteTracks.push(trackInfo);
    this.setState({
      remoteTrackIds: _.map(this.props.jitsiController.remoteTracks, (rt) => {
        return { id: rt.id, participantId: rt.participantId };
      }),
    });
  };

  onRoomTrackRemoved = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let trackId = track.getId();
    this.props.jitsiController.telimed.remoteTracks = _.reject(
      this.props.jitsiController.telimed.remoteTracks,
      { id: trackId }
    );
    this.setState({
      remoteTrackIds: _.map(
        this.props.jitsiController.telimed.remoteTracks,
        (rt) => {
          return { id: rt.id, participantId: rt.participantId };
        }
      ),
    });
  };

  onConnectionSuccess = () => {
    const { roomId } = this.state;
    try {
      this.props.jitsiController.activeRoom = this.props.jitsiController.activeConnection.initJitsiConference(
        roomId,
        {
          openBridgeChannel: true,
        }
      );
      this.props.jitsiController.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_ADDED,
        this.onRoomTrackAdded
      );
      this.props.jitsiController.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_REMOVED,
        this.onRoomTrackRemoved
      );
      // this.activeRoom.on(
      //     JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      //     onConferenceJoined);
      //     this.activeRoom.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
      //     console.log('user join');
      //     remoteTracks[id] = [];
      // });
      // this.activeRoom.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
      // this.activeRoom.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
      //     console.log(`${track.getType()} - ${track.isMuted()}`);
      // });
      // this.activeRoom.on(
      //     JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
      //     (userID, displayName) => console.log(`${userID} - ${displayName}`));
      //     this.activeRoom.on(
      //     JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      //     (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
      //     this.activeRoom.on(
      //     JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
      //     () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
      this.props.jitsiController.activeRoom.join();
      this.setState({
        status: "open",
        lastError: "",
        activeRoomId: uuidv4(),
      });
    } catch (error) {
      this.setState({
        status: "closed",
        lastError: error.message,
      });
    }
  };

  onConnectionFailed = (a, b, c, d) => {
    this.setState({
      status: "closed",
      lastError: a,
      activeRoomId: null,
    });
  };

  onConnectionDisconnect = () => {
    this.props.jitsiController.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess
    );
    this.props.jitsiController.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed
    );
    this.props.jitsiController.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.onConnectionDisconnect
    );
    this.props.jitsiController.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_ADDED,
      this.onRoomTrackAdded
    );
    this.props.jitsiController.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_REMOVED,
      this.onRoomTrackRemoved
    );
  };

  onConnect = () => {
    const { roomId, serverURL } = this.state;
    this.setState({
      status: "Joining...",
    });
    this.props.jitsiController.activeConnection = new window.JitsiMeetJS.JitsiConnection(
      null,
      null,
      {
        hosts: {
          domain: serverURL,
          muc: `conference.${serverURL}`, // FIXME: use XEP-0030
        },
        serviceUrl: `wss://${serverURL}/xmpp-websocket?room=${roomId}`,
        clientNode: `https://${serverURL}`,
      }
    );

    this.props.jitsiController.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      this.onConnectionSuccess
    );
    this.props.jitsiController.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      this.onConnectionFailed
    );
    this.props.jitsiController.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      this.onConnectionDisconnect
    );
    this.props.jitsiController.activeConnection.connect();
  };

  onDisconnect = () => {
    if (this.props.jitsiController.activeRoom) {
      this.setState({
        status: "Leaving...",
      });
      try {
        this.props.jitsiController.activeRoom.leave().then(() => {
          if (this.props.jitsiController.activeConnection) {
            this.props.jitsiController.activeConnection.disconnect();
          }
          this.setState({
            status: "closed",
            remoteTracks: [],
            activeRoomId: null,
          });
        });
      } catch (error) {
        this.setState({
          status: "closed",
          lastError: error.message,
        });
      }
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
          <RemoteTrack
            jitsiController={this.props.jitsiController}
            trackIds={trackGroups[participantId]}
            selectedSpeakerDeviceId={selectedSpeakerDeviceId}
          />
        </div>
      );
    }

    return ret;
  };

  render() {
    const {
      selectedSpeakerDeviceId,
      serverURL,
      roomId,
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
            Server:{" "}
            <input
              readOnly={status !== "closed"}
              type="text"
              onChange={(event) => {
                this.setState({ serverURL: event.target.value });
              }}
              value={serverURL}
            />
          </div>
          <div>
            Room:{" "}
            <input
              readOnly={status !== "closed"}
              type="text"
              onChange={(event) => {
                this.setState({ roomId: event.target.value });
              }}
              value={roomId}
            />
          </div>
          <div>
            {status === "closed" ? (
              <button onClick={this.onConnect}>Connect</button>
            ) : status === "open" ? (
              <button onClick={this.onDisconnect}>Disconnect</button>
            ) : (
              <button disabled={true}>{status}</button>
            )}
          </div>
          <div>{lastError}</div>
        </div>
        <div className="TR">
          <div className="TR_Header">
            <h3>Me</h3>
            <LocalSpeaker
              deviceList={deviceList}
              key="LocalSpeaker"
              defaultSpeakerId={defaultSpeakerId}
              onSpeakerChanged={this.onSpeakerChanged}
            />
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
