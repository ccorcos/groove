import React from "react";
import { Component, Store } from "reactive-magic";
import SizeStore from "./stores/size";
import Playable from "./playable";
import ColorStore, { hexToRgba } from "./stores/color";
import { modPos } from "./utils/mod-math";
import Slidable from "./slidable";

function repeat(list, n) {
  let acc = [];
  for (var i = 0; i < n; i++) {
    acc = acc.concat(list);
  }
  return acc;
}

const buttonWidth = 48;
const buttonMargin = 8;
const width = buttonWidth * 6 + buttonMargin * 6 * 2;

export default class Keyboard extends Component {
  getKeyboardContainerStyle() {
    return {
      display: "flex",
      margin: 8,
      overflow: "hidden",
      width: width,
      border: `1px solid black`,
      borderRadius: 4,
      borderColor: hexToRgba(ColorStore.blue, 0.2),
      cursor: "ew-resize"
    };
  }

  getKeyboardStyle({ sliding, offset }) {
    return {
      height: 200,
      flex: 1,
      display: "flex",
      alignItems: "center",
      transform: `translateX(${offset.x}px)`,
      transition: !sliding ? "transform ease-in-out 0.5s" : undefined
    };
  }

  getKeyButtonStyle({ isRoot, sliding }) {
    return {
      flexShrink: 0,
      height: 80,
      width: buttonWidth,
      margin: buttonMargin,
      borderRadius: 4,
      backgroundColor: isRoot ? ColorStore.red : ColorStore.blue,
      opacity: 0.2,
      cursor: !sliding && "pointer"
    };
  }

  getPlayableNotes() {
    return scaleStore.notes.reduce(
      (acc, on, note) => {
        if (on) {
          acc.push(note);
        }
        return acc;
      },
      []
    );
  }

  onSnap = offset => {
    if (offset.x === null) {
      return offset;
    }
    const playableNotes = this.getPlayableNotes();
    const notesPerOctave = playableNotes.length;
    if (notesPerOctave === 0) {
      return { y: offset.y, x: 0 };
    }
    const noteWidth = buttonWidth + 2 * buttonMargin;
    const min = width - notesPerOctave * 8 * noteWidth;
    const max = 0;
    const snap = Math.round(offset.x / noteWidth) * noteWidth;
    return { y: offset.y, x: Math.max(min, Math.min(max, snap)) };
  };

  viewButtons({ sliding }) {
    // need to register these as deps because we might not use them on the first render
    const scaleOffset = scaleStore.offset;
    const scaleBase = scaleStore.base;

    // playable notes in the scale
    const playableNotes = this.getPlayableNotes();

    const notesPerOctave = playableNotes.length;
    const allNotes = repeat(playableNotes, 8);

    return allNotes.map((note, index) => {
      const isRoot = modPos(note, 12) === modPos(scaleOffset, 12);

      const octave = Math.floor(index / notesPerOctave);
      const offsetNote = note + octave * 12;

      // Compute the index of the note where the current offset is.
      const nthNoteInScale = playableNotes.indexOf(modPos(scaleOffset, 12));
      const rootNote = scaleBase + scaleOffset;
      const rootOctave = Math.floor(rootNote / 12);
      const rootOffsetIndex = rootOctave * notesPerOctave + nthNoteInScale;
      const slide = rootOctave * notesPerOctave + nthNoteInScale;

      return (
        <Playable
          key={offsetNote}
          nth={index - slide}
          note={offsetNote}
          render={({ onMouseDown, onMouseUp, onMouseLeave }) => (
            <div
              className="button"
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              style={this.getKeyButtonStyle({ isRoot, sliding })}
            />
          )}
        />
      );
    });
  }

  view({ scaleStore }) {
    return (
      <Slidable
        onSnap={this.onSnap}
        filterTarget={target => target.className !== "button"}
        render={(
          {
            onMouseDown,
            onMouseUp,
            onMouseMove,
            onMouseLeave,
            offset,
            sliding
          }
        ) => (
          <div
            style={this.getKeyboardContainerStyle()}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <div style={this.getKeyboardStyle({ sliding, offset })}>
              {this.viewButtons({ sliding })}
            </div>
          </div>
        )}
      />
    );
  }
}
