/**
 * Created by nuintun on 2015/11/20.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('../../util');
var Vue = require('../../vue/vue');
var Terminal = require('../../terminal');

Terminal.defaultColors = {
  bg: 'transparent',
  fg: 'inherit'
};

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
    project: function (){
      this.command = this.project.command.slice(0, 3);
      this.moreCommand = this.project.command.slice(3);
    }
  },
  methods: {
    isRunning: function (){

    },
    exec: function (name, command){
      console.log('run %s: %s', name, command);

      var runtime = window.AppRuntime[this.project.name];

      var test = [
        '\u001b[92m\'use strict\'\u001b[39m\u001b[90m;\u001b[39m',
        '\u001b[90m/*jshint browser:true */\u001b[39m',
        '',
        '\u001b[32mvar\u001b[39m \u001b[37mTerminal\u001b[39m \u001b[93m=\u001b[39m \u001b[37mrequire\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'./term\'\u001b[39m\u001b[90m)\u001b[39m',
        '  \u001b[32m,\u001b[39m \u001b[37mthrough\u001b[39m \u001b[93m=\u001b[39m \u001b[37mrequire\u001b[39m\u001b[90m(\u001b[39m\u001b[92m\'through\'\u001b[39m\u001b[90m)\u001b[39m',
        '  \u001b[90m;\u001b[39m',
        '',
        '\u001b[37mmodule\u001b[39m\u001b[32m.\u001b[39m\u001b[37mexports\u001b[39m \u001b[93m=\u001b[39m \u001b[94mfunction\u001b[39m \u001b[90m(\u001b[39m\u001b[37mcols\u001b[39m\u001b[32m,\u001b[39m \u001b[37mrows\u001b[39m\u001b[32m,\u001b[39m \u001b[37mhandler\u001b[39m\u001b[90m)\u001b[39m \u001b[33m{\u001b[39m',
        '  \u001b[32mvar\u001b[39m \u001b[37mterm\u001b[39m \u001b[93m=\u001b[39m \u001b[31mnew\u001b[39m \u001b[37mTerminal\u001b[39m\u001b[90m(\u001b[39m\u001b[37mcols\u001b[39m\u001b[32m,\u001b[39m \u001b[37mrows\u001b[39m\u001b[32m,\u001b[39m \u001b[37mhandler\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '  \u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37mopen\u001b[39m\u001b[90m(\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '  ',
        '  \u001b[32mvar\u001b[39m \u001b[37mhypernal\u001b[39m \u001b[93m=\u001b[39m \u001b[37mthrough\u001b[39m\u001b[90m(\u001b[39m\u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37mwrite\u001b[39m\u001b[32m.\u001b[39m\u001b[37mbind\u001b[39m\u001b[90m(\u001b[39m\u001b[37mterm\u001b[39m\u001b[90m)\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '  \u001b[37mhypernal\u001b[39m\u001b[32m.\u001b[39m\u001b[37mappendTo\u001b[39m \u001b[93m=\u001b[39m \u001b[94mfunction\u001b[39m \u001b[90m(\u001b[39m\u001b[37melem\u001b[39m\u001b[90m)\u001b[39m \u001b[33m{\u001b[39m',
        '    \u001b[94mif\u001b[39m \u001b[90m(\u001b[39m\u001b[94mtypeof\u001b[39m \u001b[37melem\u001b[39m \u001b[93m===\u001b[39m \u001b[92m\'string\'\u001b[39m\u001b[90m)\u001b[39m \u001b[37melem\u001b[39m \u001b[93m=\u001b[39m \u001b[37mdocument\u001b[39m\u001b[32m.\u001b[39m\u001b[37mquerySelector\u001b[39m\u001b[90m(\u001b[39m\u001b[37melem\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '',
        '    \u001b[37melem\u001b[39m\u001b[32m.\u001b[39m\u001b[37mappendChild\u001b[39m\u001b[90m(\u001b[39m\u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37melement\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '    \u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37melement\u001b[39m\u001b[32m.\u001b[39m\u001b[37mstyle\u001b[39m\u001b[32m.\u001b[39m\u001b[37mposition\u001b[39m \u001b[93m=\u001b[39m \u001b[92m\'relative\'\u001b[39m\u001b[90m;\u001b[39m',
        '  \u001b[33m}\u001b[39m\u001b[90m;\u001b[39m',
        '',
        '  \u001b[37mhypernal\u001b[39m\u001b[32m.\u001b[39m\u001b[37mwriteln\u001b[39m \u001b[93m=\u001b[39m \u001b[94mfunction\u001b[39m \u001b[90m(\u001b[39m\u001b[37mline\u001b[39m\u001b[90m)\u001b[39m \u001b[33m{\u001b[39m',
        '    \u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37mwriteln\u001b[39m\u001b[90m(\u001b[39m\u001b[37mline\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '  \u001b[33m}\u001b[39m\u001b[90m;\u001b[39m',
        '',
        '  \u001b[37mhypernal\u001b[39m\u001b[32m.\u001b[39m\u001b[37mwrite\u001b[39m \u001b[93m=\u001b[39m \u001b[37mterm\u001b[39m\u001b[32m.\u001b[39m\u001b[37mwrite\u001b[39m\u001b[32m.\u001b[39m\u001b[37mbind\u001b[39m\u001b[90m(\u001b[39m\u001b[37mterm\u001b[39m\u001b[90m)\u001b[39m\u001b[90m;\u001b[39m',
        '',
        '  \u001b[31mreturn\u001b[39m \u001b[37mhypernal\u001b[39m\u001b[90m;\u001b[39m',
        '\u001b[33m}\u001b[39m\u001b[90m;\u001b[39m',
        ''
      ];

      if (!runtime) {
        var xterm = new Terminal({
          cols: 220,
          rows: 70
        });

        xterm.open();
        this.$els.terminal.appendChild(xterm.element);

        console.log(xterm);

        test.forEach(function (line){ xterm.writeln(line); });

        window.AppRuntime[this.project.name] = {
          name: name,
          command: command,
          xterm: xterm
        }
      } else {
        test.forEach(function (line){ runtime.xterm.writeln(line); });
      }
    },
    setting: function (){
      this.showSetting = true;
    },
    remove: function (){
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
  }
});
