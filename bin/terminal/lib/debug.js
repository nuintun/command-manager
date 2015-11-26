/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * log
   */
  Terminal.prototype.log = function (){
    if (!this.debug) return;

    if (!window.console || !window.console.log) return;

    var args = Array.prototype.slice.call(arguments);

    window.console.log.apply(window.console, args);
  };

  /**
   * error
   */
  Terminal.prototype.error = function (){
    if (!this.debug) return;

    if (!window.console || !window.console.error) return;

    var args = Array.prototype.slice.call(arguments);

    window.console.error.apply(window.console, args);
  };
};
