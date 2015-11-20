/**
 * Created by nuintun on 2015/11/16.
 */

'use strict';

var ipc = require('ipc-renderer');
var Vue = require('./js/vue/vue');

require('./js/components/app-configure');
require('./js/components/window-control');
require('./js/components/app-nav');
require('./js/components/directory');
require('./js/components/dynamic-item');

window.addEventListener('DOMContentLoaded', function (){
  var app = new Vue({
    el: '#app',
    data: {
      activeIndex: 0,
      configure: {}
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
