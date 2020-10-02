import React from "react";
import { Settings } from "./Settings";

export default {
  title: "Components/Settings",
  component: Settings,
};

/**
 * Primary UI component for user interaction
 */
export const ViewSettings = () => {
  const deviceList = [
    { id: "mic", name: "Mic", type: "audioinput" },
    { id: "camera", name: "Camera", type: "videoinput" },
    { id: "speaker", name: "Speaker", type: "audiooutput" },
  ];
  return <Settings deviceList={deviceList} />;
};
