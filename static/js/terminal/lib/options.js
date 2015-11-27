/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.termName = 'xterm';
  Terminal.debug = false;
  Terminal.geometry = [100, 80];
  Terminal.cursor = true;
  Terminal.cursorBlink = true;
  Terminal.cursorBlinkSpeed = 500;
  Terminal.visualBell = true;
  Terminal.popOnBell = true;
  Terminal.scrollback = 640;
  Terminal.screenKeys = false;
  Terminal.programFeatures = false;

  // Terminal defaults
  Terminal.defaults = {
    debug: Terminal.debug,
    termName: Terminal.termName,
    cursor: Terminal.cursor,
    cursorBlink: Terminal.cursorBlink,
    cursorBlinkSpeed: Terminal.cursorBlinkSpeed,
    visualBell: Terminal.visualBell,
    popOnBell: Terminal.popOnBell,
    scrollback: Terminal.scrollback,
    screenKeys: Terminal.screenKeys,
    programFeatures: Terminal.programFeatures
  };
};
