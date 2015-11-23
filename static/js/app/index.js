/**
 * Created by nuintun on 2015/11/16.
 */

'use strict';

var ipc = require('ipc-renderer');
var Vue = require('../vue/vue');

require('../components/app-configure');
require('../components/window-control');
require('../components/app-nav');
require('../components/app-main');

window.addEventListener('DOMContentLoaded', function (){
  var app;

  function normalize(configure){
    return JSON.parse(JSON.stringify(configure));
  }

  function init(configure){
    app = new Vue({
      el: '#app',
      data: {
        activeIndex: 0,
        configure: configure
      },
      computed: {
        uniqueProjects: function (){
          var cache = {};

          this.configure.projects.forEach(function (project){
            cache[project.name] = true;
          });

          return cache;
        }
      },
      events: {
        'change-active': function (index){
          this.activeIndex = index;
        },
        'save-configure': function (){
          ipc.send('app-configure', 'save', normalize(this.configure));
        }
      }
    });
  }

  ipc.on('app-configure', function (event, command, configure){
    switch (command) {
      case 'refresh':
        if (app) {
          app.activeIndex = 0;
          configure.projects = configure.projects || [];
          app.configure = configure;

          app.$broadcast('configure-refresh');
        } else {
          init(configure);
        }
        break;
    }
  });

  ipc.send('app-configure', 'refresh');
}, false);
