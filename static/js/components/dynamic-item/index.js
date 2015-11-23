/**
 * Created by nuintun on 2015/11/17.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Vue = require('../../vue/vue');

module.exports = Vue.component('dynamic-item', {
  // camelCase in JavaScript
  props: {
    nameLabel: {
      type: String,
      required: true,
      default: ''
    },
    valueLabel: {
      type: String,
      required: true,
      default: ''
    },
    items: {
      type: Array,
      twoWay: true,
      default: function (){
        return [];
      }
    }
  },
  template: fs.readFileSync(path.join(__dirname, 'dynamic-item.html')).toString(),
  data: function (){
    return {
      name: '',
      value: '',
      nameError: '',
      valueError: ''
    };
  },
  computed: {
    uniqueItems: function (){
      var cache = {};

      this.items.forEach(function (item){
        cache[item.name] = true;
      }, this);

      return cache;
    }
  },
  methods: {
    add: function (){
      // trim value
      this.name = this.name.trim();
      this.value = this.value.trim();

      // name error
      if (this.name) {
        if (this.uniqueItems[this.name]) {
          this.nameError = ' ' + this.name + ' 已存在';
        } else {
          this.nameError = '';
        }
      } else {
        this.nameError = '不能为空';
      }

      // value error
      if (this.value) {
        this.valueError = '';
      } else {
        this.valueError = '不能为空';
      }

      // add item
      if (this.name && this.value && !this.uniqueItems[this.name]) {
        // add item
        this.items.push({ name: this.name, value: this.value });

        // clean input
        this.name = '';
        this.value = '';
      }
    },
    focus: function (key){
      this[key] = '';
    },
    remove: function (index){
      this.items.splice(index, 1);
    }
  },
  events: {
    'clean-error': function (){
      this.nameError = '';
      this.valueError = '';
    }
  }
});
