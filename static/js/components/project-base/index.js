/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

require('../directory');

module.exports = Vue.component('project-base', {
  template: fs.readFileSync(path.join(__dirname, 'project-base.html')).toString(),
  props: {
    originName: {
      type: String,
      twoWay: true,
      default: ''
    },
    path: {
      type: String,
      twoWay: true,
      default: ''
    },
    unique: {
      type: Object,
      required: true
    }
  },
  data: function (){
    return {
      name: this.originName,
      nameError: '',
      pathError: ''
    };
  },
  watch: {
    originName: function (name){
      this.name = name;
    }
  },
  methods: {
    focus: function (key){
      this[key] = '';
    },
    isValid: function (){
      this.name = this.name.trim();
      this.path = this.path.trim();

      if (this.name) {
        if (this.originName && this.originName !== this.name && this.unique[this.name]) {
          this.nameError = '项目已存在';
        } else {
          this.nameError = '';
          this.originName = this.name;
        }
      } else {
        this.nameError = '项目名称不能为空';
      }

      if (this.path) {
        this.pathError = '';
      } else {
        this.pathError = '项目路径不能为空';
      }

      return !this.nameError && !this.pathError;
    }
  },
  events: {
    'reset-error': function (){
      this.nameError = '';
      this.pathError = '';
    },
    'reset-input': function (){
      this.name = '';
      this.path = '';
    }
  }
});
