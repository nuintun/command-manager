/**
 * Created by nuintun on 2015/12/3.
 */

function textRepeat(text, n){
  var str = '';

  for (var i = 0; i < n; i++) {
    str += text;
  }

  return str;
}

function CanvasXTerm(font){
  this.font = font || { family: 'Consolas', lineHeight: 20, size: 13, color: '#fff' };
  this.canvas = document.createElement('canvas');
  this.canvas.style.backgroundColor = 'transparent';
  this.brush = this.canvas.getContext('2d');
  this.brush.textAlign = 'start';
  this.brush.textBaseline = 'bottom';
  this.brush.font = this.font + ' ' + this.fontSize;
  this.brush.fillStyle = this.font.color;
  this.baseY = (this.font.lineHeight + this.font.size) / 2;
}

CanvasXTerm.prototype = {
  draw: function (screen){
    var text = '';
    var rows = screen.length;
    var cols = rows ? screen[0].length : 0;
    var node, i, j, x, y, attrCache, stylesCache;

    if (!this.rows || !this.cols || this.rows !== rows || this.cols !== cols) {
      this.rows = rows;
      this.cols = cols;

      this.canvas.width = this.measureWidth(
        textRepeat('A', cols),
        'italic bold ' + ' ' + this.font.size + 'px' + this.font.family
      );

      this.canvas.height = rows * this.font.lineHeight;
    }

    for (i = 0; i < rows; i++) {
      x = 0;
      y = i * 20 + this.baseY;
      text = '';

      for (j = 0; j < cols; j++) {
        node = screen[i][j];

        //if (j = 0) {
        //  attrCache = node.attr;
        //  stylesCache = this.getStyles(node);
        //}
        //
        //if (node.value) {
        //  if (node.attr !== attrCache) {
        //    x = this.drawText(text, x, y, this.getStyles(stylesCache)).x;
        //    attrCache = node.attr;
        //    stylesCache = this.getStyles(node);
        //  }
        //
        //  text += node.value;
        //}
      }

      //this.drawText(text, x, y, this.getStyles(stylesCache));
    }
  },
  getStyles: function (node){
    var styles = {};

    if (node.background) {
      styles.background = background;
    }

    if (node.foreground) {
      styles.foreground = foreground;
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
  },
  drawText: function (text, x, y, styles){
    var font = styles.italic ? 'italic' : 'normal'
    + ' ' + styles.bold ? 'bold' : 'normal'
    + ' ' + this.font.size + 'px'
    + ' ' + this.font.family;

    var width = this.measureWidth(text, font);

    if (styles.background) {
      this.brush.save();

      this.fillStyle = styles.background;

      this.brush.fillRect(x, y - this.font.size, width, this.font.size);
      this.brush.restore();
    }

    this.brush.save();

    this.font = font;
    this.brush.fillStyle = styles.foreground;

    this.fillText(text, x, y);
    this.brush.restore();

    if (styles.underline) {
      underline.call(this.brush, x, x + width, y, styles.foreground);
    }

    return {
      x: x + width,
      y: y
    };
  },
  measureWidth: function (text, font){
    this.brush.save();

    this.brush.font = font;

    var width = this.brush.measureText(text).width;

    this.brush.restore();

    return width;
  }
};

function underline(fromX, toX, Y, foreground){
  this.save();
  this.translate(0, parseInt(Y) === Y ? 0 : 0.5);
  this.lineWidth = 1;
  this.strokeStyle = foreground;
  this.beginPath();
  this.moveTo(fromX, Y);
  this.lineTo(toX, Y);
  this.stroke();
  this.restore();
};
