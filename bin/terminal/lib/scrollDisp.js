/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * scroll
   */
  Terminal.prototype.scroll = function (){
    var row;

    if (++this.ybase === this.scrollback) {
      this.ybase = this.ybase / 2 | 0;
      this.lines = this.lines.slice(-(this.ybase + this.rows) + 1);
    }

    this.ydisp = this.ybase;

    // last line
    row = this.ybase + this.rows - 1;

    // subtract the bottom scroll region
    row -= this.rows - 1 - this.scrollBottom;

    if (row === this.lines.length) {
      // potential optimization:
      // pushing is faster than splicing
      // when they amount to the same
      // behavior.
      this.lines.push(this.blankLine());
    } else {
      // add our new line
      this.lines.splice(row, 0, this.blankLine());
    }

    if (this.scrollTop !== 0) {
      if (this.ybase !== 0) {
        this.ybase--;
        this.ydisp = this.ybase;
      }

      this.lines.splice(this.ybase + this.scrollTop, 1);
    }

    this.updateRange(this.scrollTop);
    this.updateRange(this.scrollBottom);
  };

  /**
   * scrollDisp
   * @param disp
   */
  Terminal.prototype.scrollDisp = function (disp){
    this.ydisp += disp;

    if (this.ydisp > this.ybase) {
      this.ydisp = this.ybase;
    } else if (this.ydisp < 0) {
      this.ydisp = 0;
    }

    this.refresh(0, this.rows - 1);
  };
};
