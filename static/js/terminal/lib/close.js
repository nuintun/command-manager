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
    this.ondataTitle = function (){};

    if (this.element) {
      var parent = this.element.parentNode;

      if (parent) {
        parent.removeChild(this.element);
      }

      this.element = null;
    }
  };
};
