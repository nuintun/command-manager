/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // ESC c Full Reset (RIS).
  Terminal.prototype.reset = function (){
    this.resetOptions.rows = this.rows;
    this.resetOptions.cols = this.cols;

    Terminal.call(this, this.resetOptions);
    this.refresh(0, this.rows - 1);
  };
};
