/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');

require('../project-base');
require('../dynamic-item');

module.exports = Vue.component('project-configure', {
  template: fs.readFileSync(path.join(__dirname, 'project-configure.html')).toString(),
  props: {
    show: {
      type: Boolean,
      twoWay: true,
      default: false
    },
    project: {
      type: Object,
      required: true
    },
    unique: {
      type: Object,
      required: true
    }
  },
  data: function (){
    return {
      clone: null
    }
  },
  watch: {
    project: function (project){
      this.clone = util.clone(project);
      // clean
      this.reset();
    }
  },
  methods: {
    reset: function (){
      // clean item input
      var base = this.$refs.base;
      var env = this.$refs.env;
      var command = this.$refs.command;

      base.$emit('reset-error');
      env.$emit('reset-error');
      command.$emit('reset-error');
      env.$emit('reset-input');
      command.$emit('reset-input');
    },
    edit: function (){
      if (this.$refs.base.isValid()) {
        this.show = false;

        // send message
        this.$dispatch('edit', util.clone(this.clone));
        // clean
        this.reset();
      }
    },
    cancel: function (){
      this.show = false;
      this.clone = util.clone(this.project);

      // clean
      this.reset();
    }
  },
  created: function (){
    this.clone = util.clone(this.project);
  }
});
