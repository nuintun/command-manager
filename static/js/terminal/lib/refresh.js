/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // Rendering Engine
  // In the screen buffer, each character
  // is stored as a an array with a character
  // and a 32-bit integer.
  // First value: a utf-16 character.
  // Second value:
  // Next 9 bits: background color (0-511).
  // Next 9 bits: foreground color (0-511).
  // Next 14 bits: a mask for misc.
  // flags: 1=bold, 2=underline, 4=blink, 8=inverse, 16=invisible

  /**
   * refresh
   * @param start
   * @param end
   */
  Terminal.prototype.refresh = function (start, end){
    var parent = this.screen ? this.screen.parentNode : null;
    var optimize = parent && end - start >= this.rows / 2;
    var x, y, i, line, out, ch, width, data, attr, fgColor, bgColor, flags, row;

    if (optimize) {
      parent.removeChild(this.screen);
    }

    width = this.cols;
    y = start;

    if (end >= this.lines.length) {
      end = this.lines.length - 1;
    }

    for (; y <= end; y++) {
      i = 0;
      out = '';
      attr = this.defAttr;
      row = y + this.ydisp;
      line = this.lines[row];

      if (y === this.y && this.cursor && this.cursorState && this.ydisp === this.ybase) {
        x = this.x;
      } else {
        x = -1;
      }

      for (; i < width; i++) {
        data = line[i][0];
        ch = line[i][1];

        if (i === x) data = -1;

        if (data !== attr) {
          if (attr !== this.defAttr) {
            out += '</span>';
          }

          if (data !== this.defAttr) {
            if (data === -1) {
              out += '<span class="ui-terminal-cursor">';
            } else {
              out += '<span style="';
              bgColor = data & 0x1ff;
              fgColor = (data >> 9) & 0x1ff;
              flags = data >> 18;

              // bold
              if ((flags & 1)) {
                if (!Terminal.brokenBold) {
                  out += 'font-weight:bold;';
                }

                // see: XTerm*boldColors
                if (fgColor < 8) fgColor += 8;
              }

              // underline
              if ((flags & 2)) {
                out += 'text-decoration:underline;';
              }

              // blink
              if ((flags & 4)) {
                if ((flags & 2)) {
                  out = out.slice(0, -1);
                  out += ' blink;';
                } else {
                  out += 'text-decoration:blink;';
                }
              }

              // inverse
              if ((flags & 8)) {
                bgColor = (data >> 9) & 0x1ff;
                fgColor = data & 0x1ff;
                // Should inverse just be before the
                // above boldColors effect instead?
                if ((flags & 1) && fgColor < 8) fgColor += 8;
              }

              // invisible
              if ((flags & 16)) {
                out += 'visibility:hidden;';
              }

              if (bgColor !== 256) {
                out += 'background-color:' + this.colors[bgColor] + ';';
              }

              if (fgColor !== 257) {
                out += 'color:' + this.colors[fgColor] + ';';
              }

              out += '">';
            }
          }
        }

        switch (ch) {
          case '&':
            out += '&amp;';
            break;
          case '<':
            out += '&lt;';
            break;
          case '>':
            out += '&gt;';
            break;
          default:
            if (ch <= ' ') {
              out += '&nbsp;';
            } else {
              if (this.isWide(ch)) i++;

              out += ch;
            }
            break;
        }

        attr = data;
      }

      if (attr !== this.defAttr) {
        out += '</span>';
      }

      this.children[y].innerHTML = out;
    }

    if (optimize) {
      parent.appendChild(this.screen);
    }
  };
};
