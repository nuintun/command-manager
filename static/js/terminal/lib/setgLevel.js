/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * setgLevel
   * @param g
   */
  Terminal.prototype.setgLevel = function (g){
    this.glevel = g;
    this.charset = this.charsets[g];
  };
};
