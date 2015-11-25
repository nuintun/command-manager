/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.termName = 'xterm';
  Terminal.geometry = [10, 24];
  Terminal.cursorBlink = true;
  Terminal.visualBell = true;
  Terminal.popOnBell = true;
  Terminal.scrollback = 1000;
  Terminal.screenKeys = false;
  Terminal.programFeatures = false;
  Terminal.debug = false;

  Terminal.defaults = {
    termName: Terminal.termName,
    cursorBlink: Terminal.cursorBlink,
    visualBell: Terminal.visualBell,
    popOnBell: Terminal.popOnBell,
    scrollback: Terminal.scrollback,
    screenKeys: Terminal.screenKeys,
    programFeatures: Terminal.programFeatures,
    debug: Terminal.debug
  };
};
