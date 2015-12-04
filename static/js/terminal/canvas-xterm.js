/**
 * Created by nuintun on 2015/12/3.
 */

'use strict';

/**
 * textRepeat
 * @param text
 * @param n
 * @returns {string}
 */
function textRepeat(text, n){
  var str = '';

  for (var i = 0; i < n; i++) {
    str += text;
  }

  return str;
}

/**
 * iterator
 * @param from
 * @param iterator
 * @param context
 */
function iterator(from, iterator, context){
  for (var key in from) {
    if (from.hasOwnProperty(key)) {
      iterator.call(context, key, from[key]);
    }
  }
}

// default font
var FONT = {
  size: 13,
  color: '#fff',
  lineHeight: 20,
  family: 'Consolas'
};

/**
 * CanvasXTerm
 * @param font
 * @constructor
 */
function CanvasXTerm(font){
  font = font || {};

  // font setting
  this.font = {};

  // inherits
  iterator(FONT, function (key, value){
    if (font.hasOwnProperty(key)) {
      this.font[key] = font[key];
    } else {
      this.font[key] = value;
    }
  }, this);

  this.canvas = document.createElement('canvas');
  this.canvas.style.backgroundColor = 'transparent';
  this.brush = this.canvas.getContext('2d');
}

// CanvasXTerm prototype
CanvasXTerm.prototype = {
  /**
   * draw
   * @param screen
   */
  draw: function (screen){
    var text = '';
    var context = this;
    var rows = screen.rows;
    var cols = screen.cols;
    var lineCache = null;
    var attrCache = null;
    var stylesCache = null;
    var width, height;
    var node, i, j, x, y, line, canvas, brush;

    if (!this.rows || !this.cols || this.rows !== rows || this.cols !== cols) {
      this.rows = rows;
      this.cols = cols;

      width = measureWidth(
        this.brush,
        textRepeat('A', cols),
        'italic bold ' + this.font.size + 'px ' + this.font.family
      );

      height = rows * this.font.lineHeight;

      this.lru = new LRUCache(rows);
    } else {
      width = this.canvas.width;
      height = this.canvas.height;
    }

    // clear canvas
    this.canvas.width = width;
    this.canvas.height = height;

    function reset(){
      text = '';
      attrCache = node.attr;
      stylesCache = context.getStyles(node);
    }

    for (i = 0; i < rows; i++) {
      line = screen.buffer[i];

      if (!line) {
        continue;
      }

      x = 0;
      y = i * this.font.lineHeight;
      lineCache = this.lru.get(line.id);

      if (lineCache && lineCache.version === line.version) {
        this.brush.drawImage(lineCache.canvas, 0, y, lineCache.canvas.width, lineCache.canvas.height);
        continue;
      }

      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = this.font.lineHeight;
      canvas.style.backgroundColor = 'transparent';
      brush = canvas.getContext('2d');

      for (j = 0; j < cols; j++) {
        node = line.cells[j];

        if (!node) {
          continue;
        }

        if (j === 0) {
          reset();
        }

        if (node.value) {
          if (node.attr !== attrCache) {
            x = drawLine(brush, text, x, stylesCache);

            reset();
          }

          text += node.value;
        }
      }

      if (text) {
        drawLine(brush, text, x, stylesCache);
      }

      this.brush.drawImage(canvas, 0, y, canvas.width, canvas.height);

      // cache line
      this.lru.set(line.id, {
        canvas: canvas,
        version: line.version
      });
    }
  },
  /**
   * getStyles
   * @param node
   * @returns {{}}
   */
  getStyles: function (node){
    var styles = {};

    styles.font = this.font;

    if (node.background) {
      styles.background = node.background;
    }

    if (node.foreground) {
      styles.foreground = node.foreground;
    } else {
      styles.foreground = this.font.color;
    }

    if (node.conceal) {
      styles.foreground = styles.background = 'transparent';
    }

    ['bold', 'italic', 'underline', 'blink'].forEach(function (key){
      styles[key] = node[key];
    });

    return styles;
  }
};

/**
 * measureWidth
 * @param brush
 * @param text
 * @param font
 * @returns {Number}
 */
function measureWidth(brush, text, font){
  brush.save();

  brush.font = font;

  var width = brush.measureText(text).width;

  brush.restore();

  return width;
}

/**
 * drawBackground
 * @param brush
 * @param x
 * @param y
 * @param width
 * @param height
 * @param background
 */
function drawBackground(brush, x, y, width, height, background){
  brush.save();

  brush.fillStyle = background;

  brush.fillRect(x, y, width, height);
  brush.restore();
}

/**
 * drawUnderline
 * @param brush
 * @param x
 * @param y
 * @param width
 * @param foreground
 */
function drawUnderline(brush, x, y, width, foreground){
  brush.save();
  brush.translate(0, parseInt(y) === y ? 0.5 : 0);

  brush.lineWidth = 1;
  brush.strokeStyle = foreground;

  brush.beginPath();
  brush.moveTo(x, y);
  brush.lineTo(x + width, y);
  brush.stroke();
  brush.restore();
}

/**
 * drawLine
 * @param brush
 * @param text
 * @param x
 * @param styles
 */
function drawLine(brush, text, x, styles){
  var y;
  var font = (styles.italic ? 'italic ' : 'normal ')
    + (styles.bold ? 'bold ' : 'normal ')
    + styles.font.size + 'px '
    + styles.font.family;

  var width = measureWidth(brush, text, font);

  if (styles.background) {
    y = (styles.font.lineHeight - styles.font.size) / 2;

    drawBackground(brush, x, y, width, styles.font.size, styles.background);
  }

  brush.save();

  brush.font = font;
  brush.fillStyle = styles.foreground;
  brush.textAlign = 'start';
  brush.textBaseline = 'middle';
  y = styles.font.lineHeight / 2;

  brush.fillText(text, x, y);
  brush.restore();

  if (styles.underline) {
    y = (styles.font.lineHeight + styles.font.size) / 2;

    drawUnderline(brush, x, y, width, styles.foreground);
  }

  return x + width;
}
