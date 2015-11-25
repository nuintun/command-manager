/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.prototype.blinkCursor = function (){
    if (Terminal.focus !== this) return;

    this.cursorState ^= 1;
    this.refresh(this.y, this.y);
  };

  Terminal.prototype.showCursor = function (){
    if (!this.cursorState) {
      this.cursorState = 1;
      
      this.refresh(this.y, this.y);
    }
  };

  Terminal.prototype.startBlink = function (){
    if (!this.cursorBlink) return;

    var context = this;

    this._blinker = function (){
      context.blinkCursor();
    };

    this._blink = setInterval(this._blinker, 500);
  };

  Terminal.prototype.refreshBlink = function (){
    if (!this.cursorBlink) return;

    clearInterval(this._blink);

    this._blink = setInterval(this._blinker, 500);
  };
};
