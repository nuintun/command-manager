/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // Colors 0-15
  Terminal.colors = [
    // dark:
    '#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf',
    // bright:
    '#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'
  ];

  // Colors 16-255
  // Much thanks to TooTallNate for writing this.
  Terminal.colors = (function (){
    var i;
    var colors = Terminal.colors;
    var r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];

    // 16-231
    i = 0;

    for (; i < 216; i++) {
      out(r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]);
    }

    // 232-255 (grey)
    i = 0;

    for (; i < 24; i++) {
      r = 8 + i * 10;
      out(r, r, r);
    }

    function out(r, g, b){
      colors.push('#' + hex(r) + hex(g) + hex(b));
    }

    function hex(c){
      c = c.toString(16);

      return c.length < 2 ? '0' + c : c;
    }

    return colors;
  })();

  Terminal.vcolors = (function (){
    var color;
    var i = 0;
    var out = [];
    var colors = Terminal.colors;

    for (; i < 256; i++) {
      color = parseInt(colors[i].substring(1), 16);

      out.push([(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff]);
    }

    return out;
  })();

  // Default BG/FG
  Terminal.defaultColors = {
    bgColor: '#000000',
    fgColor: '#f0f0f0'
  };

  Terminal.colors[256] = Terminal.defaultColors.bgColor;
  Terminal.colors[257] = Terminal.defaultColors.fgColor;
};
