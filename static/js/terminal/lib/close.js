/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.prototype.close = function (){
    this.lines = [];
    this.children = [];
    this.readable = false;
    this.writable = false;
    this.handler = function (){};
    this.write = function (){};

    if (this.element) {
      var parent = this.element.parentNode;

      if (parent) {
        parent.removeChild(this.element);
      }

      this.element = null;
    }
  };
};
