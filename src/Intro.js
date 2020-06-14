import React, { useState } from "react";
import "./App.css";
import App from "./App";
import Play from "./Play";

export default function Intro() {
  const [state, setstate] = useState("app");
  return <div>{state === "app" ? <App /> : <Play />}</div>;
}
