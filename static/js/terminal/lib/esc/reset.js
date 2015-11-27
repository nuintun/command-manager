/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // ESC c Full Reset (RIS).
  Terminal.prototype.reset = function (){
    var parent;

    if (this.screen) {
      parent = this.screen.parentNode;

      if (parent) {
        parent.removeChild(this.screen);
      }
    }

    Terminal.call(this, this.options);

    this.open();

    if (parent) {
      parent.appendChild(this.screen);
    }
  };
};
