/**
 * Created by nuintun on 2015/11/25.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.focus = null;

  /**
   * isFocused
   * @returns {boolean}
   */
  Terminal.prototype.isFocused = function (){
    return Terminal.focus === this;
  };

  /**
   * focus
   */
  Terminal.prototype.focus = function (){
    if (Terminal.focus === this) return;

    if (Terminal.focus) {
      Terminal.focus.blur();
    }

    Terminal.focus = this;

    if (this.cursor) {
      this.showCursor();
    }

    if (this.cursorBlink) {
      this.startBlink();
    }
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
