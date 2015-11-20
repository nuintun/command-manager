/**
 * Created by nuintun on 2015/11/19.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var ipc = require('ipc-renderer');
var Vue = require('../../vue/vue');

module.exports = Vue.component('app-configure', {
  template: fs.readFileSync(path.join(__dirname, 'app-configure.html')).toString(),
  props: {
    configure: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  data: function (){
    return {
      name: '',
      path: '',
      _cached: {},
      submitError: '',
      popup: false
    }
  },
  methods: {
    focus: function (){
      this.submitError = '';
    },
    appConfigure: function (command, configure){
      ipc.send('app-configure', command, configure);
    },
    popupToggle: function (){
      this.popup = !this.popup;

      if (!this.popup) {
        this.submitError = '';
        this.$broadcast('clean-error');
      }
    },
    addProject: function (){
      this.$broadcast('submit');

      if (this.name && this.path) {
        if (this.$data._cached[this.name]) {
          this.submitError = '项目已存在';
        } else {
          this.popup = false;
          this.configure.projects.push({ name: this.name, path: this.path });
          this.$data._cached[this.name] = true;

          // clean imput
          this.name = '';
          this.path = '';
          this.submitError = '';
        }
      }
    }
  },
  created: function (){
    this.configure.projects.forEach(function (project){
      this.$data._cached[project.name] = true;
    }, this);
  }
});
