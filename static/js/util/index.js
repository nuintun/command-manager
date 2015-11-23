/**
 * Created by nuintun on 2015/11/23.
 */

'use strict';

module.exports = {
  normalize: function (vue){
    return JSON.parse(JSON.stringify(vue));
  },
  clone: function (object){
    var result;

    switch (typeof object) {
      case 'object':
        if (object === null) {
          result = null;
        } else {
          if (Array.isArray(object)) {
            result = object.slice(0);
          } else {
            result = {};

            Object.keys(object).forEach(function (key){
              result[key] = module.exports.clone(object[key]);
            });
          }
        }
        break;
      default:
        result = object;
        break;
    }

    return result;
  }
};
