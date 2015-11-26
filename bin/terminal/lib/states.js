/**
 * Created by nuintun on 2015/11/24.
 */

'use strict';

module.exports = {
  normal: 0,
  escaped: 1,
  csi: 2,
  osc: 3,
  charset: 4,
  dcs: 5,
  ignore: 6,
  udk: { type: 'udk' }
};
