/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var ipc = require('ipc-renderer');
var Vue = require('../../vue/vue');

module.exports = Vue.component('project-configure', {
  template: fs.readFileSync(path.join(__dirname, 'project-configure.html')).toString(),
  props: {
    activeIndex: {
      type: Number,
      required: true
    },
    projects: {
      type: Object,
      twoWay: true,
      required: true
    },
    uniqueProjects: {
      type: Object,
      twoWay: true,
      required: true
    }
  },
  computed: {
    project: function (){
      return this.projects[this.activeIndex] || { name: '', path: '', env: [], command: [] };
    }
  },
  methods: {
    focus: function (event){
      if (event.target.type === 'text') {
        this.submitError = '';
      }
    },
    edit: function (){
      this.$broadcast('submit');

      console.log(this.project);
    }
  }
});
