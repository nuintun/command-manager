/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // CSI Ps @
  // Insert Ps (Blank) Character(s) (default = 1) (ICH).
  Terminal.prototype.insertChars = function (params){
    var param, row, j, ch;

    param = params[0];

    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.x;
    ch = [this.curAttr, ' ']; // xterm

    while (param-- && j < this.cols) {
      this.lines[row].splice(j++, 0, ch);
      this.lines[row].pop();
    }
  };

  // CSI Ps L
  // Insert Ps Line(s) (default = 1) (IL).
  Terminal.prototype.insertLines = function (params){
    var param, row, j;

    param = params[0];

    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.rows - 1 - this.scrollBottom;
    j = this.rows - 1 + this.ybase - j + 1;

    while (param--) {
      // test: echo -e '\e[44m\e[1L\e[0m'
      // blankLine(true) - xterm/linux behavior
      this.lines.splice(row, 0, this.blankLine(true));
      this.lines.splice(j, 1);
    }

    // this.maxRange();
    this.updateRange(this.y);
    this.updateRange(this.scrollBottom);
  };

  // CSI Ps M
  // Delete Ps Line(s) (default = 1) (DL).
  Terminal.prototype.deleteLines = function (params){
    var param, row, j;

    param = params[0];

    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.rows - 1 - this.scrollBottom;
    j = this.rows - 1 + this.ybase - j;

    while (param--) {
      // test: echo -e '\e[44m\e[1M\e[0m'
      // blankLine(true) - xterm/linux behavior
      this.lines.splice(j + 1, 0, this.blankLine(true));
      this.lines.splice(row, 1);
    }

    // this.maxRange();
    this.updateRange(this.y);
    this.updateRange(this.scrollBottom);
  };

  // CSI P m SP }
  // Insert P s Column(s) (default = 1) (DECIC), VT420 and up.
  // NOTE: xterm doesn't enable this code by default.
  Terminal.prototype.insertColumns = function (params){
    var i;
    var param = params[0];
    var l = this.ybase + this.rows;
    var ch = [this.eraseAttr(), ' ']; // xterm

    while (param--) {
      for (i = this.ybase; i < l; i++) {
        this.lines[i].splice(this.x + 1, 0, ch);
        this.lines[i].pop();
      }
    }

    this.maxRange();
  };

  // CSI P m SP ~
  // Delete P s Column(s) (default = 1) (DECDC), VT420 and up
  // NOTE: xterm doesn't enable this code by default.
  Terminal.prototype.deleteColumns = function (params){
    var i;
    var param = params[0];
    var l = this.ybase + this.rows;
    var ch = [this.eraseAttr(), ' ']; // xterm

    while (param--) {
      for (i = this.ybase; i < l; i++) {
        this.lines[i].splice(this.x, 1);
        this.lines[i].push(ch);
      }
    }

    this.maxRange();
  };

  // CSI Ps P
  // Delete Ps Character(s) (default = 1) (DCH).
  Terminal.prototype.deleteChars = function (params){
    var param, row, ch;

    param = params[0];

    if (param < 1) param = 1;

    row = this.y + this.ybase;
    ch = [this.curAttr, ' ']; // xterm

    while (param--) {
      this.lines[row].splice(this.x, 1);
      this.lines[row].push(ch);
    }
  };

  // CSI Ps X
  // Erase Ps Character(s) (default = 1) (ECH).
  Terminal.prototype.eraseChars = function (params){
    var param, row, j, ch;

    param = params[0];

    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.x;
    ch = [this.curAttr, ' ']; // xterm

    while (param-- && j < this.cols) {
      this.lines[row][j++] = ch;
    }
  };
};
