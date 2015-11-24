/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  // CSI Ps b Repeat the preceding graphic character Ps times (REP).
  Terminal.prototype.repeatPrecedingCharacter = function (params){
    var param = params[0] || 1,
      line = this.lines[this.ybase + this.y],
      ch = line[this.x - 1] || [this.defAttr, ' '];

    while (param--) line[this.x++] = ch;
  };
};
