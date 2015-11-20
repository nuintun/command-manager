/**
 * Created by nuintun on 2015/11/17.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var ipc = require('ipc-renderer');
var Vue = require('../../vue/vue');

module.exports = Vue.component('directory', {
  // camelCase in JavaScript
  props: {
    label: {
      type: String,
      required: true
    },
    path: {
      type: String,
      twoWay: true,
      default: ''
    }
  },
  template: fs.readFileSync(path.join(__dirname, 'directory.html')).toString(),
  methods: {
    open: function (){
      ipc.send('open-directory', this.path, this._uid);
    }
  },
  created: function (){
    var context = this;

    ipc.on('select-directory', function (event, paths, uid){
      if (context._uid === uid) {
        context.path = paths[0];
      }
    });
  }
});
