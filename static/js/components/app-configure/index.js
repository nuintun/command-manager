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
    unique: {
      type: Object,
      required: true
    }
  },
  data: function (){
    return {
      name: '',
      path: '',
      showPopup: false
    }
  },
  methods: {
    appConfigure: function (command, configure){
      ipc.send('app-configure', command, configure);
    },
    hidePopup: function (){
      this.showPopup = false;
      // clean input
      var base = this.$refs.base;

      base.$emit('reset-input');
      base.$emit('reset-error');
    },
    add: function (){
      var base = this.$refs.base;

      if (base.isValid()) {
        // add
        this.configure.projects.push({
          name: this.name,
          path: this.path,
          env: [],
          command: []
        });

        // active index
        var index = Math.max(0, this.configure.projects.length - 1);

        // send message
        this.$dispatch('change-active', index, true);
        this.$dispatch('save-configure');

        // hide popup
        this.showPopup = false;
        // clean
        base.$emit('reset-input');
      }
    }
  },
  created: function (){
    var context = this;

    document.addEventListener('click', function (event){
      var target = event.target;
      var popup = context.$els.popup;
      var trigger = context.$els.popupTrigger;

      if (trigger.contains(target) || popup.contains(target)) {
        context.showPopup = true;
      } else if (context.showPopup) {
        context.hidePopup();
      }
    });
  }
});
