// import React from 'react';
// import ReactDOM from 'react-dom';
// import './index.css';
// import { App } from './App';
import React from "react";
import { App } from "./App";

window.JitsiMeetJS.init();

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

export default {
  title: "Components/App",
  component: App,
};

/**
 * Primary UI component for user interaction
 */
export const JitsiApp = () => {
  const jitsiController = {
    remoteTracks: [],
    activeConnection: null,
    activeRoom: null,
  };

  return <App jitsiController={jitsiController} />;
};
