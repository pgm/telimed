import React from "react";
import _ from "lodash";

class Selection extends React.Component {
  render() {
    const { deviceList, selection, onChange, deviceType } = this.props;

    return (
      <select
        value={selection}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {_.map(
          _.concat(
            [{ name: "none", id: "none", type: "none" }],
            _.filter(deviceList, { type: deviceType })
          ),
          (d) => {
            return (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            );
          }
        )}
      </select>
    );
  }
}

export class Settings extends React.Component {
  constructor(props) {
    super(props);

    const {
      initialOuputDeviceId = "none",
      initialAudioInputDeviceId = "none",
      initialVideoInputDeviceId = "none",
    } = this.props;

    this.state = {
      audioInputDeviceId: initialOuputDeviceId,
      audioOutputDeviceId: initialAudioInputDeviceId,
      videoInputDeviceId: initialVideoInputDeviceId,
    };
  }

  onAudioOutputChange = (deviceId) => {
    this.setState({ audioOutputDeviceId: deviceId });
    if (this.props.onAudioOutputChange) {
      this.props.onAudioOutputChange(deviceId);
    }
  };

  onAudioInputChange = (deviceId) => {
    this.setState({ audioInputDeviceId: deviceId });
  };

  onVideoInputChange = (deviceId) => {
    this.setState({ videoInputDeviceId: deviceId });
  };

  render() {
    const {
      audioInputDeviceId,
      audioOutputDeviceId,
      videoInputDeviceId,
    } = this.state;
    const { deviceList } = this.props;

    return (
      <div>
        <div>
          <span>Camera</span>
          <Selection
            deviceList={deviceList}
            selection={videoInputDeviceId}
            deviceType="videoinput"
            onChange={(id) => this.onVideoInputChange(id)}
          />
          <span>Microphone</span>
          <Selection
            deviceList={deviceList}
            selection={audioInputDeviceId}
            deviceType="audioinput"
            onChange={(id) => this.onAudioInputChange(id)}
          />
          <span>Speaker</span>
          <Selection
            deviceList={deviceList}
            selection={audioOutputDeviceId}
            deviceType="audiooutput"
            onChange={(id) => this.onAudioOutputChange(id)}
          />
        </div>
      </div>
    );
  }
}
