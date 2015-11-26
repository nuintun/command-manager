/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  /**
   * updateRange
   * @param y
   */
  Terminal.prototype.updateRange = function (y){
    if (y < this.refreshStart) this.refreshStart = y;

    if (y > this.refreshEnd) this.refreshEnd = y;
  };

  /**
   * maxRange
   */
  Terminal.prototype.maxRange = function (){
    this.refreshStart = 0;
    this.refreshEnd = this.rows - 1;
  };
};
