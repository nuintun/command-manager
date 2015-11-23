/**
 * Created by nuintun on 2015/11/23.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

module.exports = Vue.component('no-data', {
  template: fs.readFileSync(path.join(__dirname, 'no-data.html')).toString(),
  props: {
    projects: {
      type: Array,
      required: true
    }
  }
});
