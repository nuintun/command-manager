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
      popup: false
    }
  },
  methods: {
    appConfigure: function (command, configure){
      ipc.send('app-configure', command, configure);
    },
    popupToggle: function (){
      this.popup = !this.popup;
    },
    addProject: function (){
      
    }
  }
});
