/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * close
   */
  Terminal.prototype.close = function (){
    this.lines = [];
    this.children = [];
    this.readable = false;
    this.writable = false;
    this.write = function (){};
    this.ondata = function (){};
    this.ontitle = function (){};

    if (this.screen) {
      var parent = this.screen.parentNode;

      if (parent) {
        parent.removeChild(this.screen);
      }

      this.screen = null;
    }
  };
};
