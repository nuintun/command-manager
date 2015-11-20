/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

module.exports = Vue.component('app-configure', {
  template: fs.readFileSync(path.join(__dirname, 'project-base.html')).toString(),
  props: {
    name: {
      type: String,
      twoWay: true,
      default: ''
    },
    path: {
      type: String,
      twoWay: true,
      default: ''
    }
  },
  data: function (){
    return {
      nameError: '',
      pathError: ''
    };
  },
  events: {
    'submit': function (){
      this.name = this.name.trim();
      this.path = this.path.trim();

      if (this.name) {
        this.nameError = '';
      } else {
        this.nameError = '项目名称不能为空';
      }

      if (this.path) {
        this.pathError = '';
      } else {
        this.pathError = '项目路径不能为空';
      }
    }
  }
});
