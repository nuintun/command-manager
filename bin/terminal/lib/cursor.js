/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * showCursor
   */
  Terminal.prototype.showCursor = function (){
    if (this.cursor && !this._cursor) {
      this._cursor = true;
      this.cursorState = 1;

      this.refresh(this.y, this.y);

      if (this.cursorBlink && !this._blink && this._blinker) {
        this._blink = setInterval(this._blinker, this.cursorBlinkSpeed);
      }
    }
  };

  /**
   * hideCursor
   */
  Terminal.prototype.hideCursor = function (){
    if (this._cursor) {
      delete this._cursor;

      this.cursorState = 0;

      clearInterval(this._blink);

      delete this._blink;

      if (!this.cursorBlink) {
        delete this._blinker;
      }

      this.refresh(this.y, this.y);
    }
  };

  /**
   * startBlink
   */
  Terminal.prototype.startBlink = function (){
    if (this.cursor && this.cursorBlink && !this._blink) {
      var context = this;

      this._blinker = function (){
        if (context._cursor) {
          context.cursorState ^= 1;

          context.refresh(context.y, context.y);
        }
      };

      if (this._cursor) {
        this._blink = setInterval(this._blinker, this.cursorBlinkSpeed);
      }
    }
  };

  /**
   * stopBlink
   */
  Terminal.prototype.stopBlink = function (){
    if (this._blink && this._blinker) {
      clearInterval(this._blink);

      delete this._blink;
      delete this._blinker;

      if (this.cursor && this._cursor) {
        this.cursorState = 1;
      } else {
        this.cursorState = 0;
      }

      this.refresh(this.y, this.y);
    }
  };
};
