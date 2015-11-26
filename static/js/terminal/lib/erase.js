/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * eraseAttr
   * @returns {number}
   */
  Terminal.prototype.eraseAttr = function (){
    return (this.defAttr & ~0x1ff) | (this.curAttr & 0x1ff);
  };

  /**
   * eraseRight
   * @param x
   * @param y
   */
  Terminal.prototype.eraseRight = function (x, y){
    var line = this.lines[this.ybase + y];
    var ch = [this.eraseAttr(), ' '];

    for (; x < this.cols; x++) {
      line[x] = ch;
    }

    this.updateRange(y);
  };

  /**
   * eraseLeft
   * @param x
   * @param y
   */
  Terminal.prototype.eraseLeft = function (x, y){
    var line = this.lines[this.ybase + y];
    var ch = [this.eraseAttr(), ' '];

    x++;

    while (x--) line[x] = ch;

    this.updateRange(y);
  };

  /**
   * eraseLine
   * @param y
   */
  Terminal.prototype.eraseLine = function (y){
    this.eraseRight(0, y);
  };
};
