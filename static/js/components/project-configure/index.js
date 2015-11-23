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
    uniqueProjects: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  data: function (){
    return {
      nameError: '',
      pathError: '',
      submitError: '',
      projectClone: null
    }
  },
  watch: {
    project: function (project){
      this.projectClone = util.clone(project);
    }
  },
  methods: {
    focus: function (event){
      if (event.target.type === 'text') {
        this.submitError = '';
      }
    },
    edit: function (){
      var name = this.projectClone.name;
      var originName = this.project.name;

      if (this.projectClone.name && this.projectClone.path) {
        if (name !== originName && this.uniqueProjects[name]) {
          this.submitError = '项目已存在';
        } else {
          this.show = false;

          // clean error
          this.submitError = '';

          // send message
          this.$dispatch('edit', util.clone(this.projectClone));

          // clean error
          this.$broadcast('reset-error');
          // clean input
          this.$broadcast('reset-input');
        }
      }
    },
    cancel: function (){
      this.show = false;
      this.submitError = '';
      this.projectClone = util.clone(this.project);

      // clean error
      this.$broadcast('reset-error');
      // clean input
      this.$broadcast('reset-input');
    }
  },
  events: {
    'configure-refresh': function (){
      this.submitError = '';

      // clean error
      this.$broadcast('reset-error');
      // clean input
      this.$broadcast('reset-input');
    }
  },
  created: function (){
    this.projectClone = util.clone(this.project);
  }
});
