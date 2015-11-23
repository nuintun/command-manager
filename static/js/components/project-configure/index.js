/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

require('../project-base');
require('../dynamic-item');

module.exports = Vue.component('project-configure', {
  template: fs.readFileSync(path.join(__dirname, 'project-configure.html')).toString(),
  props: {
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
      submitError: ''
    }
  },
  computed: {
    projectClone: function (){
      return JSON.parse(JSON.stringify(this.project));
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
          // clean error
          this.submitError = '';
  
          // send message
          this.$dispatch('edit', this.projectClone);
        }
      }
    }
  },
  events: {
    'configure-refresh': function (){
      this.submitError = '';
      this.$broadcast('clean-error');
    }
  }
});
