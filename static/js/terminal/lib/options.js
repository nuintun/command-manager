/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.termName = 'xterm';
  Terminal.debug = false;
  Terminal.geometry = [100, 80];
  Terminal.cursorBlink = true;
  Terminal.visualBell = true;
  Terminal.popOnBell = true;
  Terminal.scrollback = 640;
  Terminal.screenKeys = false;
  Terminal.programFeatures = false;

  // terminal defaults
  Terminal.defaults = {
    debug: Terminal.debug,
    termName: Terminal.termName,
    cursorBlink: Terminal.cursorBlink,
    visualBell: Terminal.visualBell,
    popOnBell: Terminal.popOnBell,
    scrollback: Terminal.scrollback,
    screenKeys: Terminal.screenKeys,
    programFeatures: Terminal.programFeatures
  };
};
