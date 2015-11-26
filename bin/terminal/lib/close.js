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
    this.screen = '';
    this.screenLines = [];
    this.readable = false;
    this.writable = false;
    this.write = function (){};
    this.ondata = function (){};
    this.ontitle = function (){};
    this.onscreen = function (){};
  };
};
