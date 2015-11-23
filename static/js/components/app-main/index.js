/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');

require('../project-configure');

module.exports = Vue.component('app-main', {
  template: fs.readFileSync(path.join(__dirname, 'app-main.html')).toString(),
  props: {
    activeIndex: {
      type: Number,
      twoWay: true,
      required: true
    },
    projects: {
      type: Array,
      twoWay: true,
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
      showSetting: false,
      showMoreCommand: false
    };
  },
  computed: {
    project: function (){
      return util.clone(this.projects[this.activeIndex]) || {
          name: '',
          path: '',
          env: [],
          command: []
        };
    },
    command: function (){
      return this.project.command.slice(0, 3);
    },
    moreCommand: function (){
      return this.project.command.slice(3);
    }
  },
  methods: {
    setting: function (){
      this.showSetting = true;
    },
    commandToggle: function (){
      this.showMoreCommand = !this.showMoreCommand;
    },
    remove: function (){
      this.projects.splice(this.activeIndex, 1);
      this.activeIndex = 0;

      this.$dispatch('save-configure');
    }
  },
  events: {
    'setting-toggle': function (state){
      this.showSetting = state;
    },
    edit: function (project){
      this.projects.$set(this.activeIndex, project);
      this.$dispatch('save-configure');
    }
  }
});
