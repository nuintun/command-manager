/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var ipc = require('ipc-renderer');
var Vue = require('../../vue/vue');

require('../project-base');
require('../dynamic-item');

module.exports = Vue.component('project-configure', {
  template: fs.readFileSync(path.join(__dirname, 'project-configure.html')).toString(),
  props: {
    project: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  methods: {
    focus: function (event){
      if (event.target.type === 'text') {
        this.submitError = '';
      }
    },
    edit: function (){
      this.$broadcast('submit');

      console.log(this.project);
    }
  }
});
