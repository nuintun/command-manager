/**
 * Created by nuintun on 2015/11/25.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.focus = null;

  /**
   * focus
   */
  Terminal.prototype.focus = function (){
    if (Terminal.focus === this) return;

    if (Terminal.focus) {
      Terminal.focus.blur();
    }

    if (this.cursor) {
      this.showCursor();
    }

    if (this.cursorBlink) {
      this.startBlink();
    }

    Terminal.focus = this;
  };

  /**
   * blur
   */
  Terminal.prototype.blur = function (){
    if (Terminal.focus !== this) return;

    this.hideCursor();

    Terminal.focus = null;
  };
};
