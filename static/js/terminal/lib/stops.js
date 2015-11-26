/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

// ignore warnings regarging == and != (coersion makes things work here appearently)
module.exports = function (Terminal){
  /**
   * setupStops
   * @param i
   */
  Terminal.prototype.setupStops = function (i){
    if (arguments.length) {
      if (!this.tabs[i]) {
        i = this.prevStop(i);
      }
    } else {
      i = 0;
      this.tabs = {};
    }

    for (; i < this.cols; i += 8) {
      this.tabs[i] = true;
    }
  };

  /**
   * prevStop
   * @param x
   * @returns {number}
   */
  Terminal.prototype.prevStop = function (x){
    if (!arguments.length) x = this.x;

    while (!this.tabs[--x] && x > 0) {}

    return x >= this.cols ? this.cols - 1 : x < 0 ? 0 : x;
  };

  /**
   * nextStop
   * @param x
   * @returns {number}
   */
  Terminal.prototype.nextStop = function (x){
    if (!arguments.length) x = this.x;

    while (!this.tabs[++x] && x < this.cols) {}

    return x >= this.cols ? this.cols - 1 : x < 0 ? 0 : x;
  };
};
