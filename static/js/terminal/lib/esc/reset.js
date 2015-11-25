/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // ESC c Full Reset (RIS).
  Terminal.prototype.reset = function (){
    var parent;

    if (this.element) {
      parent = this.element.parentNode;

      if (parent) {
        parent.removeChild(this.element);
      }
    }

    Terminal.call(this, this.options);

    this.open();
    this.refresh(0, this.rows - 1);

    if (parent) {
      parent.appendChild(this.element);
    }
  };
};
