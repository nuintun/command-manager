/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.prototype.destroy = function (){
    this.readable = false;
    this.writable = false;
    this._events = {};
    this.handler = function (){};
    this.write = function (){};
  };
};
