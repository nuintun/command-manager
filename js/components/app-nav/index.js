/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

module.exports = Vue.component('app-nav', {
  template: fs.readFileSync(path.join(__dirname, 'app-nav.html')).toString(),
  props: {
    activeIndex: {
      type: Number,
      twoWay: true,
      required: true
    },
    configure: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  methods: {
    select: function (index){
      this.activeIndex = index;
    }
  }
});
