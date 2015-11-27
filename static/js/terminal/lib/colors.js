/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // Default colors
  Terminal.defaultColors = {
    // Colors 0-15
    colors: [
      // dark:
      '#000000', // black
      '#cd0000', // red3
      '#00cd00', // green3
      '#cdcd00', // yellow3
      '#0000ee', // blue2
      '#cd00cd', // magenta3
      '#00cdcd', // cyan3
      '#e5e5e5', // gray90
      // bright:
      '#7f7f7f', // gray50
      '#ff0000', // red
      '#00ff00', // green
      '#ffff00', // yellow
      '#5c5cff', // rgb:5c/5c/ff
      '#ff00ff', // magenta
      '#00ffff', // cyan
      '#ffffff'  // white
    ],
    // Default background color
    background: '#181818',
    // Default foreground color
    foreground: '#ffffff'
  };

  // Colors 16-255
  // Much thanks to TooTallNate for writing this.
  Terminal.makeColors = function (colors){
    var i;
    var r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff];

    // copy colors
    colors = colors.slice();

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
  };

  // Vcolors 0-255
  Terminal.makeVcolors = function (colors){
    var color;
    var i = 0;
    var out = [];

    for (; i < 256; i++) {
      color = parseInt(colors[i].substring(1), 16);

      out.push([(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff]);
    }

    return out;
  };

  // Colors 0-255
  Terminal.colors = Terminal.makeColors(Terminal.defaultColors.colors);
  // Vcolors 0-255
  Terminal.vcolors = Terminal.makeVcolors(Terminal.colors);
};
