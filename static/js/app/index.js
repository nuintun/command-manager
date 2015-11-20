/**
 * Created by nuintun on 2015/11/16.
 */

'use strict';

var ipc = require('ipc-renderer');
var Vue = require('../vue/vue');

require('../components/app-configure');
require('../components/window-control');
require('../components/app-nav');
require('../components/directory');
require('../components/dynamic-item');

window.addEventListener('DOMContentLoaded', function (){
  var app = new Vue({
    el: '#app',
    data: {
      activeIndex: 0,
      configure: {}
    },
    events: {
      'save-configure': function (){
        
      }
    }
  });

  ipc.on('app-configure', function (event, command, configure){
    switch (command) {
      case 'refresh':
        app.activeIndex = 0;
        app.configure = configure;
        break;
    }
  });

  ipc.send('app-configure', 'refresh');
}, false);
