/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * matchColor
   * @param vcolors
   * @param r1
   * @param g1
   * @param b1
   * @returns {*}
   */
  function matchColor(vcolors, r1, g1, b1){
    var hash = (r1 << 16) | (g1 << 8) | b1;

    if (matchColor._cache.hasOwnProperty(hash + '')) {
      return matchColor._cache[hash];
    }

    var i = 0;
    var li = -1;
    var ldiff = Infinity;
    var c, r2, g2, b2, diff;

    for (; i < vcolors.length; i++) {
      c = vcolors[i];
      r2 = c[0];
      g2 = c[1];
      b2 = c[2];

      diff = matchColor.distance(r1, g1, b1, r2, g2, b2);

      if (diff === 0) {
        li = i;
        break;
      }

      if (diff < ldiff) {
        ldiff = diff;
        li = i;
      }
    }

    return matchColor._cache[hash] = li;
  }

  matchColor._cache = {};

  // http://stackoverflow.com/questions/1633828
  matchColor.distance = function (r1, g1, b1, r2, g2, b2){
    return Math.pow(30 * (r1 - r2), 2)
      + Math.pow(59 * (g1 - g2), 2)
      + Math.pow(11 * (b1 - b2), 2);
  };

  // CSI Pm m  Character Attributes (SGR).
  //     Ps = 0  -> Normal (default).
  //     Ps = 1  -> Bold.
  //     Ps = 4  -> Underlined.
  //     Ps = 5  -> Blink (appears as Bold).
  //     Ps = 7  -> Inverse.
  //     Ps = 8  -> Invisible, i.e., hidden (VT300).
  //     Ps = 2 2  -> Normal (neither bold nor faint).
  //     Ps = 2 4  -> Not underlined.
  //     Ps = 2 5  -> Steady (not blinking).
  //     Ps = 2 7  -> Positive (not inverse).
  //     Ps = 2 8  -> Visible, i.e., not hidden (VT300).
  //     Ps = 3 0  -> Set foreground color to Black.
  //     Ps = 3 1  -> Set foreground color to Red.
  //     Ps = 3 2  -> Set foreground color to Green.
  //     Ps = 3 3  -> Set foreground color to Yellow.
  //     Ps = 3 4  -> Set foreground color to Blue.
  //     Ps = 3 5  -> Set foreground color to Magenta.
  //     Ps = 3 6  -> Set foreground color to Cyan.
  //     Ps = 3 7  -> Set foreground color to White.
  //     Ps = 3 9  -> Set foreground color to default (original).
  //     Ps = 4 0  -> Set background color to Black.
  //     Ps = 4 1  -> Set background color to Red.
  //     Ps = 4 2  -> Set background color to Green.
  //     Ps = 4 3  -> Set background color to Yellow.
  //     Ps = 4 4  -> Set background color to Blue.
  //     Ps = 4 5  -> Set background color to Magenta.
  //     Ps = 4 6  -> Set background color to Cyan.
  //     Ps = 4 7  -> Set background color to White.
  //     Ps = 4 9  -> Set background color to default (original).

  //   If 16-color support is compiled, the following apply.  Assume
  //   that xterm's resources are set so that the ISO color codes are
  //   the first 8 of a set of 16.  Then the aixterm colors are the
  //   bright versions of the ISO colors:
  //     Ps = 9 0  -> Set foreground color to Black.
  //     Ps = 9 1  -> Set foreground color to Red.
  //     Ps = 9 2  -> Set foreground color to Green.
  //     Ps = 9 3  -> Set foreground color to Yellow.
  //     Ps = 9 4  -> Set foreground color to Blue.
  //     Ps = 9 5  -> Set foreground color to Magenta.
  //     Ps = 9 6  -> Set foreground color to Cyan.
  //     Ps = 9 7  -> Set foreground color to White.
  //     Ps = 1 0 0  -> Set background color to Black.
  //     Ps = 1 0 1  -> Set background color to Red.
  //     Ps = 1 0 2  -> Set background color to Green.
  //     Ps = 1 0 3  -> Set background color to Yellow.
  //     Ps = 1 0 4  -> Set background color to Blue.
  //     Ps = 1 0 5  -> Set background color to Magenta.
  //     Ps = 1 0 6  -> Set background color to Cyan.
  //     Ps = 1 0 7  -> Set background color to White.

  //   If xterm is compiled with the 16-color support disabled, it
  //   supports the following, from rxvt:
  //     Ps = 1 0 0  -> Set foreground and background color to
  //     default.

  //   If 88- or 256-color support is compiled, the following apply.
  //     Ps = 3 8  ; 5  ; Ps -> Set foreground color to the second
  //     Ps.
  //     Ps = 4 8  ; 5  ; Ps -> Set background color to the second
  //     Ps.
  Terminal.prototype.charAttributes = function (params){
    // Optimize a single SGR0.
    if (params.length === 1 && params[0] === 0) {
      this.curAttr = this.defAttr;

      return;
    }

    var p;
    var i = 0;
    var l = params.length;
    var flags = this.curAttr >> 18;
    var fg = (this.curAttr >> 9) & 0x1ff;
    var bg = this.curAttr & 0x1ff;

    for (; i < l; i++) {
      p = params[i];

      if (p >= 30 && p <= 37) {
        // fg color 8
        fg = p - 30;
      } else if (p >= 40 && p <= 47) {
        // bg color 8
        bg = p - 40;
      } else if (p >= 90 && p <= 97) {
        // fg color 16
        p += 8;
        fg = p - 90;
      } else if (p >= 100 && p <= 107) {
        // bg color 16
        p += 8;
        bg = p - 100;
      } else if (p === 0) {
        // default
        flags = this.defAttr >> 18;
        fg = (this.defAttr >> 9) & 0x1ff;
        bg = this.defAttr & 0x1ff;
        // flags = 0;
        // fg = 0x1ff;
        // bg = 0x1ff;
      } else if (p === 1) {
        // bold text
        flags |= 1;
      } else if (p === 4) {
        // underlined text
        flags |= 2;
      } else if (p === 5) {
        // blink
        flags |= 4;
      } else if (p === 7) {
        // inverse and positive
        // test with: echo -e '\e[31m\e[42mhello\e[7mworld\e[27mhi\e[m'
        flags |= 8;
      } else if (p === 8) {
        // invisible
        flags |= 16;
      } else if (p === 22) {
        // not bold
        flags &= ~1;
      } else if (p === 24) {
        // not underlined
        flags &= ~2;
      } else if (p === 25) {
        // not blink
        flags &= ~4;
      } else if (p === 27) {
        // not inverse
        flags &= ~8;
      } else if (p === 28) {
        // not invisible
        flags &= ~16;
      } else if (p === 39) {
        // reset fg
        fg = (this.defAttr >> 9) & 0x1ff;
      } else if (p === 49) {
        // reset bg
        bg = this.defAttr & 0x1ff;
      } else if (p === 38) {
        // fg color 256
        if (params[i + 1] === 2) {
          i += 2;

          fg = matchColor(this.vcolors, params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);

          if (fg === -1) fg = 0x1ff;

          i += 2;
        } else if (params[i + 1] === 5) {
          i += 2;
          p = params[i] & 0xff;
          fg = p;
        }
      } else if (p === 48) {
        // bg color 256
        if (params[i + 1] === 2) {
          i += 2;

          bg = matchColor(this.vcolors, params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);

          if (bg === -1) bg = 0x1ff;

          i += 2;
        } else if (params[i + 1] === 5) {
          i += 2;
          p = params[i] & 0xff;
          bg = p;
        }
      } else if (p === 100) {
        // reset fg/bg
        fg = (this.defAttr >> 9) & 0x1ff;
        bg = this.defAttr & 0x1ff;
      } else {
        this.error('Unknown SGR attribute: %d.', p);
      }
    }

    this.curAttr = (flags << 18) | (fg << 9) | bg;
  };
};
