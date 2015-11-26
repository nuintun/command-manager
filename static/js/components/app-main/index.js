/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');
var Terminal = require('../../terminal');

const EMPTYPROJECT = {
  name: '',
  path: '',
  env: [],
  command: [],
  empty: true
};

require('../project-configure');

/**
 * clone project
 * @param projects
 * @param index
 * @returns {*}
 */
function clone(projects, index){
  return util.clone(projects[index] || EMPTYPROJECT);
}

/**
 * srcoll
 * @param xterm
 */
function scroll(xterm){
  var parent = xterm.element.parentNode;

  if (parent) {
    var viewHeight = xterm.element.parentNode.clientHeight;

    if (viewHeight < xterm.y * 18) {
      xterm.children[xterm.y].scrollIntoView();
    }
  }
}

/**
 * createXTerm
 * @param name
 * @param xtermNode
 */
function createXTerm(name, xtermNode){
  var runtime = window.AppRuntime[name];

  function refresh(xterm){
    if (xtermNode.firstChild !== xterm.element) {
      if (xtermNode.firstChild) {
        xtermNode.removeChild(xtermNode.firstChild);
      }

      xterm.focus();
      xtermNode.appendChild(xterm.element);
      xterm.children[xterm.y].scrollIntoView();
    }
  }

  if (runtime) {
    refresh(runtime.xterm);
  } else {
    var xterm = new Terminal({
      debug: true,
      bgColor: 'transparent',
      fgColor: 'inherit'
    });

    xterm.open();

    refresh(xterm);

    window.AppRuntime[name] = {
      xterm: xterm
    };
  }
}

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
    unique: {
      type: Object,
      required: true
    }
  },
  data: function (){
    var project = clone(this.projects, this.activeIndex);

    return {
      showSetting: false,
      expandCommand: false,
      project: project,
      command: project.command.slice(0, 3),
      moreCommand: project.command.slice(3)
    };
  },
  watch: {
    projects: function (){
      this.project = clone(this.projects, this.activeIndex);
    },
    activeIndex: function (){
      this.project = clone(this.projects, this.activeIndex);
    },
    project: function (project){
      this.command = project.command.slice(0, 3);
      this.moreCommand = project.command.slice(3);

      createXTerm(project.name, this.$els.terminal);
    }
  },
  methods: {
    exec: function (name, command){
      var runtime = window.AppRuntime[this.project.name];

      runtime.xterm.writeln('运行命令： \u001b[32m' + name + '\u001b[39m 在 \u001b[32m'
        + (new Date().toLocaleString()) + '\u001b[39m');
      scroll(runtime.xterm);

    },
    setting: function (){
      this.showSetting = true;
    },
    remove: function (){
      var runtime = window.AppRuntime[this.project.name];

      if (runtime) {
        runtime.xterm.close();

        delete window.AppRuntime[this.project.name];
      }

      // remove project
      this.projects.splice(this.activeIndex, 1);

      // change active
      this.activeIndex = 0;

      // save configure
      this.$dispatch('save-configure');
    }
  },
  events: {
    'setting-toggle': function (state){
      this.showSetting = state;
    },
    edit: function (project){
      if (project.name !== this.project.name) {
        window.AppRuntime[project.name] = window.AppRuntime[this.project.name];

        delete window.AppRuntime[this.project.name];
      }

      this.projects.$set(this.activeIndex, project);
      this.$dispatch('save-configure');
    }
  },
  created: function (){
    var context = this;

    document.addEventListener('click', function (event){
      var target = event.target;
      var trigger = context.$els.expandTrigger;

      context.expandCommand = trigger && trigger.contains(target);
    }, false);
  },
  ready: function (){
    createXTerm(this.project.name, this.$els.terminal);
  }
});
