/**
 * Created by nuintun on 2015/11/20.
 */


var fs = require('fs');
var path = require('path');
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
      showSetting: false
    };
  },
  computed: {
    project: function (){
      var project = this.projects[this.activeIndex] || {
          name: '',
          path: '',
          env: [],
          command: []
        };

      if (!project.env) {
        project.env = [];
      }

      if (!project.command) {
        project.command = [];
      }

      return project;
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
    remove: function (){
      this.projects.splice(this.activeIndex, 1);
      this.activeIndex = 0;
      this.$dispatch('save-configure');
    }
  },
  events: {
    edit: function (project){
      this.projects.$set(this.activeIndex, project);
      this.$dispatch('save-configure');
    }
  }
});
