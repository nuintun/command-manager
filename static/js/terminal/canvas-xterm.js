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
 * CanvasXTerm
 * @param font
 * @constructor
 */
function CanvasXTerm(font){
  this.font = font || { family: 'Consolas', lineHeight: 20, size: 13, color: '#fff' };
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
    var attrCache = null;
    var stylesCache = null;
    var width, height;
    var node, i, j, x, y;

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

    var line;
    var canvas;
    var brush;

    function reset(){
      text = '';
      attrCache = node.attr;
      stylesCache = context.getStyles(node);
    }

    for (i = 0; i < rows; i++) {
      x = 0;
      y = i * this.font.lineHeight;
      line = this.lru.get(screen.buffer[i].id);

      if (line && line.version === screen.buffer[i].version) {
        this.brush.drawImage(line.canvas, 0, y, line.canvas.width, line.canvas.height);
        continue;
      }

      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = this.font.lineHeight;
      canvas.style.backgroundColor = 'transparent';
      brush = canvas.getContext('2d');

      for (j = 0; j < cols; j++) {
        node = screen.buffer[i].cells[j];

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
      this.lru.set(screen.buffer[i].id, {
        canvas: canvas,
        version: screen.buffer[i].version
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
