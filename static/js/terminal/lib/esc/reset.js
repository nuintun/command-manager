/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // ESC c Full Reset (RIS).
  Terminal.prototype.reset = function (){
    console.log(this.options);

    this.options.rows = this.rows;
    this.options.cols = this.cols;

    Terminal.call(this, this.options);
    this.refresh(0, this.rows - 1);
  };
};
