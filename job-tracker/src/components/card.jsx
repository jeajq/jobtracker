import React from "react";
import "./card.css";

export default function Card() {
  return (
    <div className="columns-container">
      <div className="column">Column 1</div>
      <div className="column">Column 2</div>
      <div className="column">Column 3</div>
      <div className="column">Column 4</div>
    </div>
  );
}