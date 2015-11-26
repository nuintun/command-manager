/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

// if bold is broken, we can't
// use it in the terminal.
function isBoldBroken(){
  var el = document.createElement('span');

  el.innerHTML = 'hello world';

  document.body.appendChild(el);

  var w1 = el.scrollWidth;

  el.style.fontWeight = 'bold';

  var w2 = el.scrollWidth;

  document.body.removeChild(el);

  return w1 !== w2;
}

module.exports = function (Terminal){
  /**
   * open
   */
  Terminal.prototype.open = function (){
    // XXX - hack, move this somewhere else.
    if (Terminal.brokenBold === null) {
      Terminal.brokenBold = isBoldBroken();
    }

    this.refresh(0, this.rows - 1);
    this.focus();
  };
};
