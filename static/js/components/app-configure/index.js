/**
 * Created by nuintun on 2015/11/19.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var ipc = require('ipc-renderer');
var Vue = require('../../vue/vue');

require('../project-base');

module.exports = Vue.component('app-configure', {
  template: fs.readFileSync(path.join(__dirname, 'app-configure.html')).toString(),
  props: {
    configure: {
      type: Object,
      twoWay: true,
      required: true
    },
    uniqueProjects: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  data: function (){
    return {
      name: '',
      path: '',
      submitError: '',
      showPopup: false
    }
  },
  methods: {
    focus: function (event){
      if (event.target.type === 'text') {
        this.submitError = '';
      }
    },
    appConfigure: function (command, configure){
      ipc.send('app-configure', command, configure);
    },
    popupToggle: function (){
      this.showPopup = !this.showPopup;

      if (!this.showPopup) {
        this.name = '';
        this.path = '';
        this.submitError = '';

        // clean error
        this.$broadcast('reset-error');
      }
    },
    add: function (){
      this.$broadcast('submit');

      if (this.name && this.path) {
        if (this.uniqueProjects[this.name]) {
          this.submitError = '项目已存在';
        } else {
          this.showPopup = false;
          this.configure.projects.push({ name: this.name, path: this.path, env: [], command: [] });

          this.name = '';
          this.path = '';
          this.submitError = '';

          // clean error
          this.$broadcast('reset-error');

          // send message
          this.$dispatch('change-active', this.configure.projects.length - 1, true);
          this.$dispatch('save-configure');
        }
      }
    }
  }
});
