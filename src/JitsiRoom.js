import _ from "lodash";

export class LocalFeed {
  constructor() {
    this.selectedInputAudioDeviceId = null;
    this.selectedInputVideoDeviceId = null;
    this.localTracks = [];
    this.audioInputDevices = [];
    this.videoInputDevices = [];
    this.audioOutputDevices = [];
    this.listeners = {};
  }

  on(event, callback) {
    const listeners = this.listeners[event] || [];
    listeners.push(callback);
    this.listeners[event] = listeners;
  }

  fire(event, params) {
    const listeners = this.listeners[event] || [];
    _.forEach(listeners, (l) => l(params));
  }

  selectVideo(deviceId) {
    this.selectedInputVideoDeviceId = deviceId;
    this.createLocalTracks();
  }

  selectAudio(deviceId) {
    this.selectedInputAudioDeviceId = deviceId;
    this.createLocalTracks();
  }

  enumerateDevices() {
    const promise = new Promise((resolve, reject) => {
      window.JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
        resolve(devices);
        this.fire("devicesChanged");
      });
    });

    return promise;
  }

  createLocalTracks() {
    return window.JitsiMeetJS.createLocalTracks({
      devices: ["audio", "video"],
      micDeviceId: this.selectedInputAudioDeviceId,
      cameraDeviceId: this.selectedInputVideoDeviceId,
    }).then((tracks) => {
      this.localTracks = tracks;
      const videoTrack = _.find(tracks, (track) => track.getType() == "video");
      const audioTrack = _.find(tracks, (track) => track.getType() == "audio");
      this.fire("audioChanged", audioTrack);
      this.fire("videoChanged", videoTrack);
    });
  }

  initDevices() {
    const getDevicesPromise = this.enumerateDevices().then((devices) => {
      this.audioInputDevices = _.filter(devices, { kind: "audioinput" });
      this.videoInputDevices = _.filter(devices, { kind: "videoinput" });
      this.audioOutputDevices = _.filter(devices, { kind: "audiooutput" });

      if (this.audioInputDevices.length > 0) {
        this.selectedInputAudioDeviceId = this.audioInputDevices[0].deviceId;
      }

      if (this.videoInputDevices.length > 0) {
        this.selectedInputVideoDeviceId = this.videoInputDevices[0].deviceId;
      }

      console.log("initDevs", this);
    });

    const getTracksPromise = this.createLocalTracks();

    return Promise.all([getDevicesPromise, getTracksPromise]);
  }
}

export class JitsiRoom {
  constructor(serverURL) {
    this.serverURL = serverURL;
    this.connection = null;
    this.localTracks = [];
    this.remoteTracks = [];
    this.onRoomTracksChanged = [];
    this.activeRoom = null;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.listeners = {};
  }

  on(event, callback) {
    const listeners = this.listeners[event] || [];
    listeners.push(callback);
    this.listeners[event] = listeners;
  }

  fire(event, params) {
    const listeners = this.listeners[event] || [];
    _.forEach(listeners, (l) => l(params));
  }

  setLocalVideoTrack(track) {
    if (this.activeRoom) {
      const add = () => {
        return this.activeRoom.addTrack(track).then(() => {
          this.localVideoTrack = track;
        });
      };
      if (this.localVideoTrack) {
        return this.activeRoom.removeTrack(this.localVideoTrack).then(() => {
          this.localVideoTrack = null;
          add();
        });
      } else {
        return add();
      }
    } else {
      this.localVideoTrack = track;
      return Promise.resolve();
    }
  }

  setLocalAudioTrack(track) {
    console.log("ignoring onSetLocalAudioTrack", track);
  }

  disconnect() {
    const closeConnection = () => {
      if (this.connection) {
        this.connection.disconnect();
      }
    };

    if (this.activeRoom) {
      return this.activeRoom.leave().then(closeConnection);
    } else {
      closeConnection();
    }
  }

  connect(roomId) {
    this.connection = new window.JitsiMeetJS.JitsiConnection(null, null, {
      hosts: {
        domain: this.serverURL,
        muc: `conference.${this.serverURL}`, // FIXME: use XEP-0030
      },
      serviceUrl: `wss://${this.serverURL}/xmpp-websocket?room=${roomId}`,
      clientNode: `https://${this.serverURL}`,
    });

    console.log("outside promise");
    const promise = new Promise((resolve, reject) => {
      console.log("inside promise");
      const onConnectionSuccess = () => {
        console.log("initJitsiConference");

        this.activeRoom = this.connection.initJitsiConference(roomId, {
          openBridgeChannel: true,
        });

        this.activeRoom.addEventListener(
          window.JitsiMeetJS.events.conference.TRACK_ADDED,
          this.roomTrackAdded
        );

        this.activeRoom.addEventListener(
          window.JitsiMeetJS.events.conference.TRACK_REMOVED,
          this.roomTrackRemoved
        );

        console.log("localvideo", this.localVideoTrack);
        if (this.localVideoTrack) {
          console.log("adding local video");
          this.activeRoom.addTrack(this.localVideoTrack);
        }

        if (this.localAudioTrack) {
          console.log("adding local audio");

          this.activeRoom.addTrack(this.localAudioTrack);
        }

        this.activeRoom.join();

        console.log("resolve");
        resolve();
      };

      const onConnectionFailed = (a, b, c, d) => {
        reject(a);
      };

      this.connection.addEventListener(
        window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess
      );

      this.connection.addEventListener(
        window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed
      );

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
    });

    const onConnectionDisconnect = () => {
      console.log("disconnected");
    };

    this.connection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      onConnectionDisconnect
    );
    this.connection.connect();

    return promise;
  }

  roomTrackAdded = (track) => {
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

    this.fire("roomTracksChanged", this.remoteTracks);
  };

  roomTrackRemoved = (track) => {
    if (track.isLocal() === true) {
      return;
    }
    let trackId = track.getId();
    this.remoteTracks = _.reject(this.remoteTracks, { id: trackId });

    this.fire("roomTracksChanged", this.remoteTracks);
  };
}
