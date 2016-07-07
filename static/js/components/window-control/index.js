/**
 * Created by nuintun on 2015/11/19.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var electron = require('electron');
var ipc = electron.ipcRenderer;
var Vue = require('../../vue/vue');

module.exports = Vue.component('window-control', {
  data: function (){
    return {
      isMaximized: false
    }
  },
  template: fs.readFileSync(path.join(__dirname, 'window-control.html')).toString(),
  methods: {
    tray: function (){
      ipc.send('window', 'tray');
    },
    close: function (){
      ipc.send('window', 'close');
    },
    maximize: function (){
      ipc.send('window', this.isMaximized ? 'unmaximize' : 'maximize');
    }
  },
  created: function (){
    var context = this;

    ipc.on('is-maximized', function (event, maximized){
      context.isMaximized = maximized;
    });

    ipc.send('window', 'is-maximized');
  }
});
