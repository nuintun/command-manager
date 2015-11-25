/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = function (Terminal){
  Terminal.prototype.isWide = function isWide(ch){
    if (ch <= '\uff00') return false;
    
    return (ch >= '\uff01' && ch <= '\uffbe')
      || (ch >= '\uffc2' && ch <= '\uffc7')
      || (ch >= '\uffca' && ch <= '\uffcf')
      || (ch >= '\uffd2' && ch <= '\uffd7')
      || (ch >= '\uffda' && ch <= '\uffdc')
      || (ch >= '\uffe0' && ch <= '\uffe6')
      || (ch >= '\uffe8' && ch <= '\uffee');
  };

  Terminal.prototype.ch = function (cur){
    return cur ? [this.curAttr, ' '] : [this.defAttr, ' '];
  };

  Terminal.prototype.is = function (term){
    var name = this.termName || Terminal.termName;

    return (name + '').indexOf(term) === 0;
  };
};
