/* Map Technology Copyright (C) 2011 DougX.net, used with permission */

var g_map_backgroundColor = "#eeeeee";        // background to draw map on
var g_map_borderColor = "#ffffff";            // state border color
var g_map_highlightBorderColor = "white";  // highlighted state border color

var g_map_baseRGB = [180, 180, 180];          // state color default
var g_map_highlightRGB = [11, 32, 57];       // state color when highlighted

var g_map_isIE9 = false;      // must detect IE9 for proper mouse position

var g_StateMap = null;
var theStates = null;

var g_map_canvas;
var g_map_context;
var g_map_renderInterval;


var initMap = function () {
  g_map_canvas = document.getElementById('map_canvas');

  if (!g_map_canvas.getContext) {
    return;
  }

  g_map_context = g_map_canvas.getContext('2d');
  g_map_context.font = "bold 12px sans-serif";
  g_map_context.lineWidth = 1;

  var agent = navigator.userAgent;
  if (agent.indexOf("MSIE") != -1)
    g_map_isIE9 = true;

  inittheStates();
  g_map_context.fillStyle = g_map_backgroundColor;
  g_map_context.fillRect(0, 0, g_map_canvas.width, g_map_canvas.height);
  g_map_renderInterval = setInterval(renderLoop, 10);

  g_map_canvas.addEventListener('mousemove', onMouseMove, false);
  g_map_canvas.addEventListener('mousedown', onMouseDown, false);

}

var onMouseMove = function (e) {
  var x;
  var y;

  if (e.offsetX || e.offsetX == 0) {
    x = e.offsetX;
    y = e.offsetY;
  }
  else if (e.layerX || e.layerX == 0) {
    x = e.layerX;
    y = e.layerY;

  }


  if (g_map_isIE9) {
    x = e.x;
    y = e.y;
  }

  /*---end generic mouse event processing---*/

  y = g_map_canvas.height - y;   // translate to map y coord

  var highState = null;
  for (var i in g_StateMap) {
    var found = isPointInState(x, y, g_StateMap[i]);

    if (found && (highState == null)) {
      highState = g_StateMap[i];
    }
    else {
      g_StateMap[i].mouseOut();
    }
  }

  if (highState != null)
    highState.mouseIn();
}

var onMouseDown = function (e) {
  e.preventDefault();

  var x;
  var y;

  if (e.offsetX || e.offsetX == 0) {
    x = e.offsetX;
    y = e.offsetY;
  }
  else if (e.layerX || e.layerX == 0) {
    x = e.layerX;
    y = e.layerY;
  }

  if (g_map_isIE9) {
    x = e.x;
    y = e.y;
  }


  /*---end generic mouse event processing---*/

  y = g_map_canvas.height - y;           //translate to map y coord


  for (var i in g_StateMap) {
    var found = isPointInState(x, y, g_StateMap[i]);

    if (found) {
      g_StateMap[i].mouseClick(x, y, g_StateMap[i]);
      break;
    }
  }

}

var renderLoop = function () {
  var highState = null;
  for (var i in g_StateMap) {
    if (!g_StateMap[i].highlighted)
      g_StateMap[i].draw();
    else
      highState = g_StateMap[i];
  }
  if (highState != null) {
    highState.draw();
  }
}

var poly = function () {
  this.ptX = null;
  this.ptY = null;
}

var isPointInState = function (x, y, state) {
  for (var i = 0; i < state.polys.length; ++i) {
    var p = state.polys[i];

    if (isPointInInPoly(x, y, p)) {
      return 1;
    }
  }
  return 0;
}


var isPointInInPoly = function (x, y, p) {
  var nodeCount = 0;
  var xValues = p.ptX;
  var yValues = p.ptY;

  var numPoints = xValues.length;

  for (var i = 0; i < numPoints; ++i) {
    var Aindex = i;
    var Bindex = i + 1;

    if (i == numPoints - 1)
      Bindex = 0;

    var Ax = xValues[Aindex];
    var Ay = yValues[Aindex];
    var Bx = xValues[Bindex];
    var By = yValues[Bindex];

    if (( Ax >= x ) && (Bx >= x )) {
      continue;
    }

    if (Ay == By) {
      continue;
    }

    if (( y > Ay  ) && (y > By )) {
      continue;
    }

    if (( y < Ay ) && (y < By )) {
      continue;
    }

    if (Ay > By) {
      if (y == Ay) {
        continue;
      }
    }
    else {
      if (y == By) {
        continue;
      }
    }
    if (Ax < Bx) {
      var m = (By - Ay) / (Bx - Ax);
      var alpha = ((y - Ay) / m) + Ax;
      if (alpha > x) {
        continue;
      }
    }
    else {
      var m = (Ay - By) / (Ax - Bx);
      var alpha = ((y - By) / m) + Bx;
      if (alpha > x) {
        continue;
      }
    }

    nodeCount++;
  }

  return ( nodeCount % 2 )
}

var State = function (abbrev, capsName, fullname, id) {
  this.nameAbbrev = abbrev;
  this.nameCAPS = capsName;
  this.nameFull = fullname;
  this.id = id;

  this.winner = null;

  this.polys = [];

  this.colorBorder = g_map_borderColor;
  this.colorBorderHighlight = g_map_highlightBorderColor;

  this.rgbColorHighlight = g_map_highlightRGB;
  this.rgbColor = g_map_baseRGB;

  this.renderCount = -1;
  this.gradientOffset = 15;
  this.highlighted = false;
  this.counted = false;

  this.onClick = null;
}

State.prototype.mouseClick = function (x, y, state) {
  if (this.onClick != null) {
    this.onClick(x, y, state);
  }
}

State.prototype.draw = function () {

  var fillColor;
  var borderColor;

  if (this.renderCount == 0) {
    return;
  }
  else if (this.renderCount < 0) {
    this.myIdle = false;
    this.renderCount++;

    var sourceR = this.rgbColor[0];
    var sourceG = this.rgbColor[1];
    var sourceB = this.rgbColor[2];

    var targetR = this.rgbColor[0];
    var targetG = this.rgbColor[1];
    var targetB = this.rgbColor[2];

    var stepR = (targetR - sourceR) / this.gradientOffset;
    var stepG = (targetG - sourceG) / this.gradientOffset;
    var stepB = (targetB - sourceB) / this.gradientOffset;

    var r = Math.floor(targetR + ( stepR * this.renderCount ));
    var g = Math.floor(targetG + ( stepG * this.renderCount ));
    var b = Math.floor(targetB + ( stepB * this.renderCount ));

    fillColor = "rgb(" + r + "," + g + "," + b + ")";
  }
  else {
    this.renderCount--;

    var targetR = this.rgbColor[0];
    var targetG = this.rgbColor[1];
    var targetB = this.rgbColor[2];

    var sourceR = this.rgbColor[0];
    var sourceG = this.rgbColor[1];
    var sourceB = this.rgbColor[2];

    var stepR = (targetR - sourceR) / this.gradientOffset;
    var stepG = (targetG - sourceG) / this.gradientOffset;
    var stepB = (targetB - sourceB) / this.gradientOffset;

    var r = Math.floor(targetR - ( stepR * this.renderCount ));
    var g = Math.floor(targetG - ( stepG * this.renderCount ));
    var b = Math.floor(targetB - ( stepB * this.renderCount ));

    fillColor = "rgb(" + r + "," + g + "," + b + ")";
  }

  if (this.highlighted)
    borderColor = this.colorBorderHighlight;
  else
    borderColor = this.colorBorder;

  g_map_context.strokeStyle = borderColor;
  g_map_context.fillStyle = fillColor;

  for (var i = 0; i < this.polys.length; ++i) {
    g_map_context.beginPath();

    for (var j = 0; j < this.polys[i].ptX.length; ++j) {
      var x = this.polys[i].ptX[j];
      var y = this.polys[i].ptY[j];

      y = g_map_canvas.height - y;

      if (j == 0)
        g_map_context.moveTo(x, y);
      else
        g_map_context.lineTo(x, y);
    }

    g_map_context.closePath();

    g_map_context.fill();

    g_map_context.stroke();
  }
}

// call this function after you have changed color settings within your custom click cb to make the map render them
// set 'highlight' (boolean) the current state should be filled highlighted or not

State.prototype.updateColor = function (highlight) {
  if (highlight == undefined || highlight == false)
    this.renderCount = -1 * this.gradientOffset;
  else
    this.renderCount = this.gradientOffset;
}

State.prototype.mouseIn = function () {
  if (!this.highlighted) {
    this.renderCount = this.gradientOffset;
    setStateResults(this.id);
  }

  this.highlighted = true;
  this.counted = true;
}

State.prototype.mouseOut = function () {
  if (this.highlighted) {
    this.renderCount = this.gradientOffset * -1;
  }

  this.highlighted = false;
}

var inittheStates = function () {
  g_StateMap = new Array();
  theStates = new Array();
  var i = -1;

  theStates.push(new State("AL", "ALABAMA", "Alabama", ++i));
  g_StateMap["AL"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [537, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 545, 544, 543, 544, 545, 511, 511, 512, 514, 514, 513, 513, 512, 511, 506, 507, 508, 509, 508, 507, 506, 505, 504, 503, 501, 501, 500, 501, 502, 503, 504, 505, 504, 514];
  theStates[i].polys[0].ptY = [240, 238, 233, 228, 222, 217, 211, 208, 206, 202, 201, 200, 197, 194, 186, 184, 184, 181, 180, 180, 178, 177, 176, 175, 174, 173, 173, 174, 175, 175, 179, 179, 175, 174, 175, 175, 183, 202, 211, 220, 228, 237, 239, 240, 240];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [503, 505, 504];
  theStates[i].polys[1].ptY = [173, 174, 173];
  theStates.push(new State("AK", "ALASKA", "Alaska", ++i));
  g_StateMap["AK"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [161, 163, 164, 172, 180, 185, 188, 191, 193, 194, 195, 195, 198, 200, 202, 205, 204, 206, 207, 207, 210, 212, 213, 213, 214, 217, 218, 219, 221, 223, 224, 225, 226, 228, 228, 229, 231, 232, 233, 234, 235, 236, 237, 239, 238, 240, 241, 241, 243, 246, 248, 249, 250, 249, 250, 249, 248, 247, 246, 245, 246, 246, 246, 245, 244, 245, 244, 244, 244, 242, 241, 241, 242, 241, 241, 240, 239, 240, 239, 238, 237, 236, 238, 239, 239, 238, 238, 237, 236, 236, 236, 235, 232, 233, 232, 232, 233, 234, 232, 231, 230, 227, 226, 225, 224, 223, 224, 224, 224, 225, 225, 224, 223, 220, 220, 220, 219, 217, 217, 216, 215, 217, 218, 219, 220, 219, 218, 217, 217, 216, 213, 212, 210, 210, 209, 206, 203, 202, 202, 202, 201, 200, 195, 193, 189, 185, 180, 177, 175, 174, 173, 170, 170, 169, 167, 167, 166, 168, 171, 170, 170, 169, 169, 168, 166, 164, 163, 163, 162, 162, 160, 160, 160, 159, 159, 158, 160, 158, 159, 160, 160, 158, 158, 159, 160, 159, 160, 160, 161, 161, 159, 158, 154, 154, 153, 152, 151, 150, 148, 147, 147, 146, 144, 144, 143, 142, 141, 141, 140, 143, 144, 145, 145, 143, 142, 141, 142, 143, 144, 143, 144, 146, 149, 150, 151, 150, 146, 144, 142, 141, 140, 138, 138, 136, 137, 137, 135, 134, 134, 133, 133, 133, 132, 131, 129, 129, 129, 130, 131, 132, 133, 133, 132, 130, 130, 129, 128, 125, 123, 122, 122, 120, 118, 118, 118, 116, 116, 115, 114, 113, 113, 111, 110, 111, 111, 109, 107, 108, 109, 109, 108, 107, 107, 105, 103, 102, 102, 102, 101, 100, 99, 98, 97, 97, 96, 95, 94, 94, 93, 91, 91, 91, 90, 89, 88, 88, 86, 87, 86, 86, 85, 84, 85, 83, 82, 78, 75, 76, 77, 78, 78, 79, 83, 83, 84, 86, 87, 88, 88, 90, 92, 96, 95, 96, 98, 99, 98, 97, 98, 99, 101, 103, 105, 106, 106, 107, 108, 109, 110, 112, 112, 111, 112, 113, 112, 113, 114, 115, 113, 110, 109, 107, 106, 106, 105, 104, 103, 102, 101, 100, 99, 97, 94, 93, 90, 91, 91, 90, 91, 90, 89, 88, 86, 79, 78, 77, 75, 75, 75, 74, 74, 75, 75, 74, 75, 75, 75, 73, 73, 72, 71, 71, 70, 69, 69, 70, 70, 71, 71, 72, 73, 74, 75, 76, 76, 77, 78, 81, 83, 85, 86, 86, 87, 89, 90, 94, 95, 96, 96, 95, 94, 93, 94, 95, 96, 96, 93, 92, 92, 89, 87, 86, 86, 85, 83, 77, 73, 68, 68, 67, 66, 68, 66, 61, 59, 61, 64, 66, 71, 71, 74, 81, 81, 80, 81, 82, 83, 85, 86, 89, 89, 91, 92, 93, 94, 94, 91, 90, 91, 89, 87, 88, 88, 90, 90, 91, 93, 91, 91, 83, 81, 81, 80, 79, 77, 75, 72, 69, 66, 68, 69, 79, 81, 83, 84, 85, 85, 85, 87, 88, 90, 96, 98, 100, 101, 103, 105, 111, 114, 115, 120, 122, 120, 123, 124, 124, 126, 127, 129, 129, 139, 138, 141, 150, 151, 152, 153, 158, 161];
  theStates[i].polys[0].ptY = [142, 141, 141, 141, 140, 141, 140, 139, 138, 137, 138, 72, 72, 71, 72, 72, 71, 70, 69, 68, 66, 63, 63, 62, 63, 64, 66, 67, 68, 69, 67, 65, 65, 64, 62, 62, 61, 60, 58, 57, 56, 54, 53, 51, 50, 49, 48, 47, 46, 45, 44, 43, 41, 39, 36, 35, 34, 33, 33, 37, 38, 38, 39, 41, 41, 37, 37, 37, 37, 37, 39, 39, 40, 41, 39, 39, 41, 43, 41, 42, 43, 44, 44, 45, 46, 47, 48, 47, 48, 49, 49, 50, 50, 51, 52, 53, 54, 54, 54, 55, 57, 57, 59, 60, 64, 63, 62, 62, 59, 58, 58, 57, 58, 59, 60, 62, 61, 62, 62, 63, 62, 62, 61, 59, 58, 58, 59, 58, 58, 58, 59, 60, 61, 63, 63, 64, 65, 66, 67, 70, 70, 69, 68, 69, 70, 71, 70, 71, 72, 73, 72, 73, 74, 73, 72, 72, 73, 73, 74, 75, 75, 75, 75, 75, 76, 77, 76, 77, 76, 76, 76, 76, 76, 77, 76, 75, 75, 74, 73, 74, 72, 72, 72, 72, 72, 71, 71, 71, 70, 70, 70, 71, 70, 69, 70, 69, 68, 68, 67, 66, 66, 65, 65, 64, 65, 64, 64, 64, 66, 66, 67, 68, 69, 68, 68, 70, 71, 73, 74, 75, 75, 76, 77, 76, 77, 78, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 68, 68, 67, 67, 67, 66, 66, 65, 63, 63, 64, 63, 62, 62, 61, 60, 58, 57, 56, 56, 55, 54, 53, 53, 52, 51, 49, 49, 49, 48, 48, 47, 47, 46, 47, 46, 45, 46, 45, 44, 43, 43, 42, 42, 42, 42, 41, 40, 39, 41, 40, 40, 39, 38, 39, 39, 38, 39, 38, 37, 38, 39, 38, 37, 36, 35, 35, 36, 37, 36, 35, 35, 36, 35, 34, 34, 33, 32, 31, 32, 33, 34, 34, 35, 35, 35, 35, 36, 37, 38, 39, 40, 41, 42, 41, 40, 41, 40, 41, 42, 44, 45, 45, 46, 47, 48, 47, 50, 51, 51, 52, 53, 53, 54, 57, 58, 59, 60, 61, 62, 62, 61, 60, 61, 62, 59, 59, 61, 62, 63, 62, 62, 63, 63, 62, 61, 60, 61, 63, 66, 68, 70, 71, 70, 70, 69, 70, 71, 72, 73, 74, 74, 74, 75, 76, 77, 78, 78, 77, 78, 78, 79, 79, 80, 81, 80, 81, 82, 82, 83, 85, 86, 87, 88, 88, 89, 91, 92, 93, 93, 92, 91, 92, 93, 93, 94, 95, 94, 95, 96, 98, 100, 101, 101, 102, 101, 102, 103, 104, 103, 103, 103, 102, 101, 101, 101, 101, 102, 101, 102, 104, 105, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 114, 113, 112, 113, 113, 112, 113, 112, 112, 112, 113, 114, 114, 114, 115, 114, 116, 116, 117, 118, 119, 118, 116, 115, 115, 116, 118, 119, 120, 122, 123, 124, 124, 125, 126, 127, 128, 129, 132, 132, 133, 134, 136, 137, 137, 139, 139, 141, 141, 142, 143, 144, 145, 146, 145, 146, 147, 148, 149, 148, 147, 146, 147, 147, 148, 146, 146, 145, 146, 145, 144, 143, 144, 144, 143, 143, 142];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [35, 38, 37, 35, 35];
  theStates[i].polys[1].ptY = [74, 73, 72, 73, 74];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [162, 161, 161, 160, 161, 162];
  theStates[i].polys[2].ptY = [72, 72, 72, 72, 74, 74];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [69, 72, 72, 72, 70, 69, 66, 63, 63, 65, 66, 67, 68];
  theStates[i].polys[3].ptY = [73, 72, 71, 69, 69, 68, 69, 70, 72, 72, 71, 72, 73];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [164, 162, 161, 161, 161, 162, 163, 164, 165, 165, 165];
  theStates[i].polys[4].ptY = [71, 70, 69, 68, 69, 70, 72, 73, 73, 72, 71];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [133, 134, 134, 135, 136, 137, 138, 137, 138, 139, 140, 140, 139, 138, 137, 136, 135, 135];
  theStates[i].polys[5].ptY = [56, 57, 58, 58, 58, 59, 60, 59, 59, 59, 59, 58, 57, 58, 57, 56, 57, 56];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [226, 229, 230, 230, 231, 230, 229, 230, 231, 231, 229, 228, 227, 227, 227, 227, 226, 225, 226];
  theStates[i].polys[6].ptY = [57, 57, 56, 54, 53, 55, 55, 54, 53, 52, 51, 50, 49, 52, 52, 54, 57, 59, 58];
  theStates[i].polys.push(new poly());
  theStates[i].polys[7].ptX = [219, 220, 222, 222, 222, 225, 225, 225, 224, 223, 225, 226, 224, 223, 222, 222, 220, 219, 218, 217, 217, 218, 219];
  theStates[i].polys[7].ptY = [58, 58, 58, 57, 56, 57, 55, 55, 54, 55, 54, 52, 52, 53, 54, 52, 52, 53, 54, 55, 57, 58, 57];
  theStates[i].polys.push(new poly());
  theStates[i].polys[8].ptX = [130, 131, 132, 130, 132, 133, 132, 133, 135, 136, 135, 136, 137, 138, 138, 136, 136, 135, 137, 135, 134, 134, 134, 133, 133, 133, 132, 132, 130, 129, 131, 130, 131, 129, 128, 127, 127, 126, 127, 128, 130, 130];
  theStates[i].polys[8].ptY = [52, 53, 54, 54, 55, 54, 55, 56, 55, 56, 55, 54, 55, 53, 53, 52, 53, 53, 52, 51, 50, 50, 50, 49, 50, 50, 49, 49, 48, 47, 48, 49, 50, 49, 48, 49, 51, 52, 52, 53, 54, 53];
  theStates[i].polys.push(new poly());
  theStates[i].polys[9].ptX = [227, 226, 225, 224, 223, 223, 222, 224, 226, 226, 226, 227];
  theStates[i].polys[9].ptY = [43, 44, 46, 47, 47, 51, 53, 53, 52, 51, 49, 44];
  theStates[i].polys.push(new poly());
  theStates[i].polys[10].ptX = [222, 222, 221];
  theStates[i].polys[10].ptY = [51, 49, 51];
  theStates[i].polys.push(new poly());
  theStates[i].polys[11].ptX = [69, 69, 70];
  theStates[i].polys[11].ptY = [114, 114, 114];
  theStates[i].polys.push(new poly());
  theStates[i].polys[12].ptX = [49, 48, 49];
  theStates[i].polys[12].ptY = [50, 51, 51];
  theStates[i].polys.push(new poly());
  theStates[i].polys[13].ptX = [230, 231, 235, 236, 237, 236, 236, 235, 234, 233, 234, 234, 232, 232, 232, 230, 230];
  theStates[i].polys[13].ptY = [50, 49, 49, 48, 47, 46, 46, 46, 48, 47, 46, 46, 45, 47, 47, 48, 49];
  theStates[i].polys.push(new poly());
  theStates[i].polys[14].ptX = [229, 228, 229, 230, 231, 231, 231, 230, 229, 229];
  theStates[i].polys[14].ptY = [46, 48, 49, 47, 45, 45, 44, 44, 45, 45];
  theStates[i].polys.push(new poly());
  theStates[i].polys[15].ptX = [129, 129, 129];
  theStates[i].polys[15].ptY = [46, 45, 46];
  theStates[i].polys.push(new poly());
  theStates[i].polys[16].ptX = [127, 126, 127];
  theStates[i].polys[16].ptY = [46, 45, 46];
  theStates[i].polys.push(new poly());
  theStates[i].polys[17].ptX = [237, 235, 235];
  theStates[i].polys[17].ptY = [45, 44, 45];
  theStates[i].polys.push(new poly());
  theStates[i].polys[18].ptX = [235, 235, 236, 237, 238, 239, 238, 239, 239, 240, 240, 240, 240, 238, 238, 237, 236, 235, 235, 235, 234, 235, 236, 237, 236, 235, 235, 234, 233, 234, 233, 232, 233, 232, 231, 232, 232];
  theStates[i].polys[18].ptY = [44, 42, 42, 41, 39, 38, 38, 38, 37, 36, 35, 35, 33, 33, 34, 36, 36, 35, 36, 37, 37, 34, 35, 33, 33, 33, 34, 37, 37, 39, 40, 40, 41, 42, 41, 42, 44];
  theStates[i].polys.push(new poly());
  theStates[i].polys[19].ptX = [122, 123, 121, 122];
  theStates[i].polys[19].ptY = [41, 40, 40, 41];
  theStates[i].polys.push(new poly());
  theStates[i].polys[20].ptX = [232, 232, 234, 233, 232, 231];
  theStates[i].polys[20].ptY = [39, 39, 39, 38, 38, 39];
  theStates[i].polys.push(new poly());
  theStates[i].polys[21].ptX = [241, 242, 241];
  theStates[i].polys[21].ptY = [37, 37, 38];
  theStates[i].polys.push(new poly());
  theStates[i].polys[22].ptX = [97, 98, 97, 96, 96, 97];
  theStates[i].polys[22].ptY = [38, 37, 37, 36, 38, 38];
  theStates[i].polys.push(new poly());
  theStates[i].polys[23].ptX = [101, 100, 99, 99, 99, 100, 101];
  theStates[i].polys[23].ptY = [37, 36, 35, 35, 35, 36, 37];
  theStates[i].polys.push(new poly());
  theStates[i].polys[24].ptX = [242, 243, 242];
  theStates[i].polys[24].ptY = [37, 35, 36];
  theStates[i].polys.push(new poly());
  theStates[i].polys[25].ptX = [102, 102, 102, 102];
  theStates[i].polys[25].ptY = [36, 36, 35, 37];
  theStates[i].polys.push(new poly());
  theStates[i].polys[26].ptX = [92, 91, 92];
  theStates[i].polys[26].ptY = [36, 36, 36];
  theStates[i].polys.push(new poly());
  theStates[i].polys[27].ptX = [60, 59, 59];
  theStates[i].polys[27].ptY = [105, 104, 105];
  theStates[i].polys.push(new poly());
  theStates[i].polys[28].ptX = [244, 243, 244];
  theStates[i].polys[28].ptY = [34, 35, 35];
  theStates[i].polys.push(new poly());
  theStates[i].polys[29].ptX = [89, 88, 89];
  theStates[i].polys[29].ptY = [34, 35, 35];
  theStates[i].polys.push(new poly());
  theStates[i].polys[30].ptX = [104, 103, 104];
  theStates[i].polys[30].ptY = [34, 35, 35];
  theStates[i].polys.push(new poly());
  theStates[i].polys[31].ptX = [72, 72, 72];
  theStates[i].polys[31].ptY = [30, 29, 30];
  theStates[i].polys.push(new poly());
  theStates[i].polys[32].ptX = [72, 71, 70, 70, 71, 71];
  theStates[i].polys[32].ptY = [29, 28, 29, 29, 30, 29];
  theStates[i].polys.push(new poly());
  theStates[i].polys[33].ptX = [74, 73, 74];
  theStates[i].polys[33].ptY = [28, 29, 29];
  theStates[i].polys.push(new poly());
  theStates[i].polys[34].ptX = [69, 68, 68, 70, 68, 68, 67, 66, 64, 61, 64, 65, 65, 65, 67, 68, 68];
  theStates[i].polys[34].ptY = [28, 27, 26, 27, 26, 26, 24, 24, 24, 23, 24, 25, 26, 27, 28, 27, 28];
  theStates[i].polys.push(new poly());
  theStates[i].polys[35].ptX = [42, 42, 46, 49, 50, 53, 56, 52, 51, 49, 47, 44, 42, 41, 41];
  theStates[i].polys[35].ptY = [96, 96, 95, 96, 95, 94, 93, 92, 91, 92, 93, 94, 93, 94, 96];
  theStates[i].polys.push(new poly());
  theStates[i].polys[36].ptX = [56, 58, 59, 61, 60, 58, 58, 56, 55, 56];
  theStates[i].polys[36].ptY = [22, 23, 24, 25, 24, 23, 21, 21, 20, 22];
  theStates[i].polys.push(new poly());
  theStates[i].polys[37].ptX = [1766, 1766, 1766, 1765, 1762, 1766];
  theStates[i].polys[37].ptY = [20, 20, 19, 19, 20, 21];
  theStates[i].polys.push(new poly());
  theStates[i].polys[38].ptX = [47, 46, 47];
  theStates[i].polys[38].ptY = [18, 19, 19];
  theStates[i].polys.push(new poly());
  theStates[i].polys[39].ptX = [44, 43, 44];
  theStates[i].polys[39].ptY = [17, 18, 18];
  theStates[i].polys.push(new poly());
  theStates[i].polys[40].ptX = [1769, 1769, 1768, 1768, 1769];
  theStates[i].polys[40].ptY = [17, 17, 16, 17, 18];
  theStates[i].polys.push(new poly());
  theStates[i].polys[41].ptX = [28, 30, 29, 28, 25, 28, 28, 28];
  theStates[i].polys[41].ptY = [17, 17, 16, 15, 14, 15, 15, 16];
  theStates[i].polys.push(new poly());
  theStates[i].polys[42].ptX = [38, 37, 38];
  theStates[i].polys[42].ptY = [16, 17, 17];
  theStates[i].polys.push(new poly());
  theStates[i].polys[43].ptX = [1780, 1779, 1779];
  theStates[i].polys[43].ptY = [17, 16, 17];
  theStates[i].polys.push(new poly());
  theStates[i].polys[44].ptX = [1787, 1787, 1787];
  theStates[i].polys[44].ptY = [15, 15, 14];
  theStates[i].polys.push(new poly());
  theStates[i].polys[45].ptX = [34, 30, 32];
  theStates[i].polys[45].ptY = [15, 14, 15];
  theStates[i].polys.push(new poly());
  theStates[i].polys[46].ptX = [1788, 1787, 1786, 1788, 1788];
  theStates[i].polys[46].ptY = [13, 13, 13, 14, 15];
  theStates[i].polys.push(new poly());
  theStates[i].polys[47].ptX = [20, 19, 19];
  theStates[i].polys[47].ptY = [15, 14, 15];
  theStates[i].polys.push(new poly());
  theStates[i].polys[48].ptX = [1799, 1797, 1798];
  theStates[i].polys[48].ptY = [14, 13, 14];
  theStates[i].polys.push(new poly());
  theStates[i].polys[49].ptX = [19, 16, 16, 15, 15, 16, 17, 17, 18];
  theStates[i].polys[49].ptY = [13, 12, 12, 12, 12, 13, 14, 13, 13];
  theStates[i].polys.push(new poly());
  theStates[i].polys[50].ptX = [1793, 1792, 1792];
  theStates[i].polys[50].ptY = [14, 13, 14];
  theStates[i].polys.push(new poly());
  theStates[i].polys[51].ptX = [15, 14, 14, 14];
  theStates[i].polys[51].ptY = [14, 13, 12, 14];
  theStates[i].polys.push(new poly());
  theStates[i].polys[52].ptX = [11, 10, 10, 10, 9];
  theStates[i].polys[52].ptY = [13, 12, 12, 12, 13];
  theStates[i].polys.push(new poly());
  theStates[i].polys[53].ptX = [1795, 1795, 1793, 1793, 1794];
  theStates[i].polys[53].ptY = [11, 10, 11, 12, 11];
  theStates.push(new State("AZ", "ARIZONA", "Arizona", ++i));
  g_StateMap["AZ"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [232, 205, 202, 199, 194, 189, 186, 183, 178, 175, 171, 167, 165, 160, 158, 157, 158, 161, 161, 162, 161, 160, 159, 159, 159, 160, 161, 161, 161, 162, 163, 165, 166, 166, 165, 163, 163, 162, 161, 160, 161, 160, 159, 159, 159, 159, 158, 158, 164, 164, 166, 166, 167, 167, 232];
  theStates[i].polys[0].ptY = [189, 189, 190, 191, 193, 194, 195, 197, 198, 199, 201, 202, 203, 204, 205, 206, 207, 208, 209, 212, 213, 213, 216, 216, 218, 219, 222, 222, 225, 227, 228, 228, 229, 231, 232, 232, 234, 236, 237, 242, 243, 246, 248, 249, 253, 253, 254, 255, 256, 255, 254, 255, 256, 268, 268];
  theStates.push(new State("AR", "ARKANSAS", "Arkansas", ++i));
  g_StateMap["AR"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [478, 479, 479, 478, 477, 476, 475, 484, 485, 484, 483, 484, 482, 482, 481, 481, 481, 479, 480, 479, 478, 478, 479, 479, 479, 478, 477, 477, 476, 477, 474, 474, 473, 474, 473, 472, 473, 472, 472, 471, 471, 470, 469, 469, 468, 468, 467, 467, 466, 466, 466, 465, 467, 465, 464, 465, 464, 464, 465, 465, 464, 465, 466, 465, 466, 464, 465, 427, 427, 422, 422, 421, 420, 422];
  theStates[i].polys[0].ptY = [261, 260, 258, 257, 256, 255, 254, 254, 253, 252, 253, 252, 251, 250, 249, 249, 248, 248, 247, 246, 247, 246, 244, 244, 243, 242, 241, 241, 240, 239, 238, 236, 236, 235, 236, 234, 233, 232, 232, 231, 231, 230, 229, 229, 228, 227, 226, 226, 225, 225, 223, 223, 222, 221, 222, 221, 220, 219, 218, 218, 217, 218, 217, 216, 214, 214, 213, 212, 220, 220, 251, 257, 261, 261];
  theStates.push(new State("CA", "CALIFORNIA", "California", ++i));
  g_StateMap["CA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [90, 90, 91, 93, 94, 96, 97, 99, 100, 101, 103, 104, 105, 106, 107, 109, 110, 113, 115, 116, 118, 120, 121, 122, 124, 126, 127, 128, 129, 130, 133, 135, 136, 138, 139, 140, 141, 142, 144, 145, 146, 147, 148, 150, 151, 152, 153, 154, 156, 158, 159, 160, 161, 162, 163, 165, 166, 166, 165, 163, 162, 162, 161, 161, 161, 160, 159, 159, 159, 160, 161, 162, 161, 155, 139, 128, 127, 126, 125, 126, 125, 124, 123, 121, 120, 119, 117, 116, 114, 114, 111, 111, 111, 110, 109, 107, 105, 101, 100, 99, 98, 96, 89, 86, 84, 83, 82, 82, 81, 82, 80, 78, 79, 79, 77, 76, 75, 73, 73, 72, 71, 70, 69, 68, 66, 65, 65, 65, 65, 66, 67, 66, 65, 64, 62, 61, 60, 59, 59, 58, 57, 58, 57, 59, 59, 61, 63, 62, 61, 60, 58, 58, 59, 60, 60, 58, 58, 58, 56, 54, 51, 51, 52, 51, 50, 49, 47, 46, 46, 44, 43, 42, 42, 42, 41, 40, 41, 40, 39, 38, 37, 35, 33, 33, 34, 35, 36, 37, 36, 37, 36, 35, 48];
  theStates[i].polys[0].ptY = [338, 296, 295, 294, 293, 292, 291, 290, 289, 288, 287, 286, 285, 284, 283, 282, 281, 279, 277, 276, 275, 273, 272, 271, 270, 269, 268, 267, 266, 265, 263, 261, 260, 259, 257, 257, 256, 255, 254, 253, 252, 251, 250, 248, 247, 247, 246, 245, 243, 242, 241, 238, 236, 234, 232, 232, 231, 229, 228, 228, 227, 225, 222, 222, 219, 218, 216, 216, 213, 212, 212, 210, 208, 208, 207, 206, 208, 209, 210, 211, 214, 215, 216, 217, 218, 219, 220, 221, 222, 222, 222, 223, 225, 226, 227, 227, 226, 227, 228, 229, 230, 231, 232, 233, 232, 233, 234, 239, 239, 242, 242, 243, 244, 246, 246, 247, 248, 249, 251, 252, 254, 254, 256, 257, 257, 258, 262, 262, 262, 264, 266, 267, 268, 267, 267, 268, 269, 270, 273, 275, 276, 278, 279, 279, 276, 276, 275, 278, 279, 281, 281, 282, 282, 282, 283, 284, 281, 281, 280, 281, 282, 283, 284, 286, 288, 289, 289, 290, 291, 292, 293, 294, 295, 298, 300, 302, 306, 308, 309, 310, 311, 312, 313, 318, 320, 321, 324, 324, 327, 333, 334, 338, 338];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [94, 95, 96, 94, 93, 92, 91];
  theStates[i].polys[1].ptY = [227, 226, 227, 226, 225, 226, 227];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [86, 84, 85];
  theStates[i].polys[2].ptY = [227, 226, 227];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [90, 87, 89, 89];
  theStates[i].polys[3].ptY = [226, 225, 226, 226];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [112, 110, 110, 108, 109, 111, 112];
  theStates[i].polys[4].ptY = [216, 216, 218, 218, 219, 218, 217];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [97, 96, 96];
  theStates[i].polys[5].ptY = [216, 215, 216];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [109, 110, 111, 110, 109, 108];
  theStates[i].polys[6].ptY = [212, 211, 209, 210, 212, 212];
  theStates.push(new State("CO", "COLORADO", "Colorado", ++i));
  g_StateMap["CO"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [323, 323, 232, 232, 247];
  theStates[i].polys[0].ptY = [324, 268, 268, 324, 324];
  theStates.push(new State("CT", "CONNECTICUT", "Connecticut", ++i));
  g_StateMap["CT"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [703, 704, 705, 717, 717, 716, 714, 712, 712, 705, 705, 703, 702, 701, 700, 696, 694, 692, 692, 694, 694, 694, 695, 700];
  theStates[i].polys[0].ptY = [339, 338, 339, 338, 330, 329, 329, 328, 329, 328, 328, 328, 327, 328, 327, 326, 325, 324, 326, 326, 327, 336, 339, 339];
  theStates.push(new State("DE", "DELAWARE", "Delaware", ++i));
  g_StateMap["DE"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [669, 668, 667, 668, 667, 668, 669, 670, 670, 671, 672, 674, 674, 666, 666, 665, 666, 669, 670];
  theStates[i].polys[0].ptY = [307, 306, 305, 304, 303, 302, 301, 300, 296, 294, 294, 293, 288, 288, 295, 307, 308, 308, 307];
  theStates.push(new State("DC", "DISTRICT OF COLUMBIA", "District of Columbia", ++i));
  g_StateMap["DC"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [730, 720, 710, 720, 730];
  theStates[i].polys[0].ptY = [270, 280, 270, 260, 270];
  theStates.push(new State("FL", "FLORIDA", "Florida", ++i));
  g_StateMap["FL"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [545, 546, 546, 556, 573, 581, 581, 584, 584, 584, 583, 583, 585, 585, 587, 591, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 602, 603, 604, 605, 606, 607, 608, 609, 610, 609, 608, 607, 606, 605, 604, 602, 595, 595, 594, 593, 592, 590, 590, 589, 588, 587, 586, 584, 583, 582, 582, 583, 582, 581, 580, 579, 578, 577, 576, 575, 574, 576, 576, 577, 578, 579, 578, 577, 576, 576, 576, 576, 575, 574, 573, 574, 574, 574, 575, 576, 576, 575, 574, 574, 571, 571, 570, 569, 568, 567, 566, 565, 564, 563, 561, 559, 553, 554, 551, 549, 547, 546, 546, 541, 540, 540, 541, 540, 539, 538, 536, 534, 533, 531, 525, 524, 517, 515, 515, 512, 513, 514, 513, 514, 512, 511, 511, 539];
  theStates[i].polys[0].ptY = [184, 183, 180, 180, 179, 178, 175, 175, 176, 179, 180, 180, 181, 181, 181, 180, 177, 172, 168, 165, 163, 160, 158, 156, 155, 153, 152, 150, 148, 144, 142, 140, 137, 135, 131, 129, 126, 122, 114, 110, 109, 105, 104, 103, 103, 102, 107, 109, 110, 111, 112, 113, 113, 113, 116, 119, 120, 121, 122, 124, 127, 125, 125, 127, 128, 131, 132, 133, 135, 136, 135, 136, 138, 139, 141, 140, 142, 142, 141, 140, 138, 137, 139, 141, 144, 144, 147, 151, 152, 154, 155, 157, 157, 158, 158, 160, 161, 162, 163, 165, 166, 167, 169, 169, 170, 171, 170, 169, 168, 167, 166, 167, 166, 165, 166, 168, 169, 169, 170, 171, 172, 173, 174, 175, 176, 175, 174, 174, 174, 175, 176, 178, 180, 180, 181, 184, 184];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [549, 549, 548, 546, 544, 544, 545, 547, 548];
  theStates[i].polys[1].ptY = [166, 166, 166, 165, 164, 164, 165, 165, 166];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [544, 542, 543];
  theStates[i].polys[2].ptY = [166, 165, 166];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [581, 582, 583, 582, 581, 581];
  theStates[i].polys[3].ptY = [122, 121, 121, 120, 121, 122];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [607, 606, 605, 604, 603, 602, 602, 603, 604, 605, 606, 606, 607, 607, 608, 607];
  theStates[i].polys[4].ptY = [104, 104, 101, 100, 99, 99, 99, 101, 102, 103, 104, 104, 105, 107, 107, 105];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [600, 599, 599];
  theStates[i].polys[5].ptY = [98, 97, 98];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [598, 597, 598];
  theStates[i].polys[6].ptY = [97, 96, 97];
  theStates[i].polys.push(new poly());
  theStates[i].polys[7].ptX = [593, 592, 592];
  theStates[i].polys[7].ptY = [97, 96, 97];
  theStates[i].polys.push(new poly());
  theStates[i].polys[8].ptX = [593, 590, 588, 589, 591, 591, 592];
  theStates[i].polys[8].ptY = [96, 95, 94, 95, 96, 97, 96];
  theStates.push(new State("GA", "GEORGIA", "Georgia", ++i));
  g_StateMap["GA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [569, 568, 568, 567, 567, 567, 568, 568, 569, 570, 573, 573, 574, 575, 576, 577, 578, 580, 581, 581, 582, 584, 585, 585, 586, 587, 588, 590, 591, 591, 592, 592, 592, 592, 593, 595, 595, 595, 596, 598, 599, 598, 596, 596, 595, 595, 594, 594, 594, 594, 593, 593, 592, 591, 592, 591, 587, 585, 585, 584, 583, 584, 584, 583, 581, 581, 575, 556, 546, 546, 545, 544, 543, 544, 545, 546, 545, 544, 543, 542, 541, 540, 539, 538, 537, 570];
  theStates[i].polys[0].ptY = [240, 239, 238, 237, 236, 236, 235, 234, 234, 233, 233, 231, 228, 227, 226, 226, 225, 224, 223, 221, 220, 220, 219, 216, 215, 214, 213, 213, 212, 211, 210, 209, 208, 206, 205, 205, 204, 200, 199, 199, 198, 197, 196, 195, 194, 192, 192, 191, 190, 189, 188, 187, 184, 183, 183, 180, 180, 181, 181, 181, 180, 179, 176, 176, 175, 178, 178, 179, 180, 183, 186, 194, 197, 200, 201, 202, 206, 208, 211, 216, 222, 227, 232, 238, 240, 240];
  theStates.push(new State("HI", "HAWAII", "Hawaii", ++i));
  g_StateMap["HI"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [310, 310, 310, 309, 306, 306, 304, 303, 303, 305, 308];
  theStates[i].polys[0].ptY = [83, 82, 79, 78, 78, 79, 79, 80, 81, 82, 83];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [296, 297, 298, 299, 299, 297, 297];
  theStates[i].polys[1].ptY = [77, 78, 79, 80, 78, 78, 77];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [331, 332, 333, 334, 335, 332, 329, 328, 328, 327, 326, 329, 330, 330, 331];
  theStates[i].polys[2].ptY = [74, 72, 72, 70, 69, 69, 70, 69, 71, 73, 74, 74, 75, 76, 75];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [346, 347, 347, 349, 349, 344, 343, 341, 341, 345];
  theStates[i].polys[3].ptY = [68, 67, 68, 68, 67, 66, 67, 66, 67, 68];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [352, 353, 353, 357, 358, 360, 360, 358, 353, 353, 351, 350, 351];
  theStates[i].polys[4].ptY = [65, 64, 64, 64, 63, 62, 60, 60, 59, 62, 62, 65, 65];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [347, 348, 348, 345, 345, 344, 345];
  theStates[i].polys[5].ptY = [64, 63, 62, 61, 63, 64, 64];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [352, 350, 351];
  theStates[i].polys[6].ptY = [59, 58, 59];
  theStates[i].polys.push(new poly());
  theStates[i].polys[7].ptX = [364, 362, 361, 361, 362, 361, 360, 359, 359, 360, 361, 362, 363, 362, 361, 364, 365, 368, 370, 372, 373, 374, 374, 375, 376, 378, 377, 376, 374, 370, 369, 367, 367, 366, 365];
  theStates[i].polys[7].ptY = [34, 35, 36, 39, 41, 43, 45, 45, 47, 48, 49, 50, 51, 52, 54, 54, 53, 52, 51, 50, 49, 48, 46, 44, 44, 43, 42, 41, 40, 39, 38, 37, 35, 34, 34];
  theStates.push(new State("ID", "IDAHO", "Idaho", ++i));
  g_StateMap["ID"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [141, 142, 143, 144, 145, 146, 146, 145, 146, 146, 148, 151, 152, 153, 154, 155, 156, 156, 158, 160, 164, 164, 163, 163, 162, 162, 162, 163, 161, 161, 162, 161, 162, 163, 164, 165, 167, 168, 169, 170, 170, 171, 171, 172, 173, 174, 175, 176, 178, 178, 179, 180, 181, 182, 183, 187, 187, 188, 189, 191, 192, 193, 194, 196, 197, 200, 201, 202, 202, 203, 204, 205, 206, 206, 129, 129, 130, 130, 130, 128, 126, 126, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 135, 133, 132, 132, 131, 130, 130, 130, 130, 129, 128, 128, 128, 129, 141];
  theStates[i].polys[0].ptY = [422, 421, 420, 419, 418, 417, 417, 416, 415, 414, 413, 412, 411, 410, 409, 408, 407, 405, 405, 404, 403, 402, 401, 399, 396, 396, 394, 393, 392, 390, 389, 388, 387, 387, 387, 388, 388, 389, 390, 389, 388, 387, 385, 383, 382, 381, 378, 377, 377, 377, 376, 374, 372, 372, 372, 373, 372, 372, 374, 374, 373, 373, 374, 374, 373, 374, 375, 376, 376, 375, 375, 374, 373, 338, 338, 366, 367, 367, 369, 369, 370, 371, 373, 375, 376, 377, 378, 381, 382, 385, 386, 388, 389, 391, 391, 392, 392, 393, 395, 395, 397, 397, 399, 400, 400, 425, 436, 436];
  theStates.push(new State("IL", "ILLINOIS", "Illinois", ++i));
  g_StateMap["IL"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [509, 509, 508, 509, 510, 511, 512, 511, 511, 511, 512, 512, 512, 513, 512, 511, 510, 509, 509, 508, 507, 507, 506, 506, 506, 505, 505, 504, 504, 505, 504, 500, 500, 499, 500, 498, 496, 492, 491, 491, 490, 489, 488, 488, 487, 486, 488, 487, 486, 487, 486, 484, 484, 482, 482, 481, 481, 481, 480, 478, 477, 476, 475, 475, 476, 477, 478, 478, 479, 477, 474, 474, 473, 472, 471, 469, 468, 466, 466, 465, 463, 462, 462, 461, 461, 461, 460, 461, 462, 465, 466, 466, 467, 468, 466, 466, 471, 474, 476, 476, 478, 478, 477, 475, 475, 474, 472, 472];
  theStates[i].polys[0].ptY = [345, 343, 341, 340, 338, 335, 301, 299, 299, 297, 296, 296, 293, 292, 291, 290, 289, 289, 288, 287, 286, 285, 284, 281, 281, 280, 279, 278, 276, 275, 274, 274, 273, 272, 269, 269, 270, 271, 270, 268, 269, 269, 268, 270, 272, 272, 273, 274, 275, 276, 277, 278, 280, 280, 280, 281, 281, 282, 282, 282, 283, 284, 285, 287, 289, 290, 292, 292, 293, 294, 295, 295, 294, 295, 300, 300, 301, 302, 304, 304, 305, 306, 308, 309, 309, 311, 313, 315, 319, 319, 320, 322, 323, 326, 326, 330, 330, 331, 332, 335, 335, 340, 340, 341, 342, 343, 344, 345];
  theStates.push(new State("IN", "INDIANA", "Indiana", ++i));
  g_StateMap["IN"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [548, 548, 547, 546, 547, 547, 544, 539, 539, 540, 538, 537, 536, 534, 533, 533, 532, 531, 529, 528, 527, 527, 526, 525, 524, 524, 523, 523, 522, 520, 518, 518, 517, 515, 512, 511, 511, 510, 509, 508, 507, 505, 506, 506, 506, 507, 507, 508, 509, 509, 510, 511, 512, 513, 512, 512, 512, 511, 511, 511, 511, 512, 513, 519, 521, 532];
  theStates[i].polys[0].ptY = [335, 313, 297, 297, 295, 294, 293, 292, 290, 290, 289, 288, 287, 286, 285, 282, 281, 282, 282, 283, 284, 284, 283, 281, 280, 280, 281, 280, 282, 282, 281, 279, 280, 280, 281, 282, 280, 281, 280, 281, 279, 279, 280, 281, 284, 285, 285, 286, 287, 288, 289, 290, 291, 292, 293, 296, 296, 297, 299, 299, 301, 334, 333, 333, 334, 335];
  theStates.push(new State("IA", "IOWA", "Iowa", ++i));
  g_StateMap["IA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [464, 464, 465, 466, 465, 466, 468, 471, 472, 472, 473, 475, 475, 476, 478, 478, 476, 476, 474, 472, 466, 466, 468, 468, 467, 466, 465, 462, 462, 461, 460, 459, 458, 456, 405, 404, 404, 404, 403, 403, 403, 402, 401, 400, 400, 401, 401, 400, 399, 399, 397, 398, 397, 397, 396, 395, 395, 394, 394, 395, 395, 396, 396, 395, 395, 395, 394, 462];
  theStates[i].polys[0].ptY = [359, 357, 356, 355, 351, 348, 348, 347, 346, 345, 344, 343, 342, 341, 340, 335, 335, 332, 332, 331, 330, 326, 326, 323, 322, 320, 320, 319, 315, 316, 317, 318, 319, 319, 318, 319, 320, 327, 328, 328, 330, 331, 332, 333, 333, 334, 336, 338, 339, 339, 340, 341, 342, 345, 346, 347, 347, 348, 350, 352, 352, 353, 355, 356, 356, 358, 359, 359];
  theStates.push(new State("KS", "KANSAS", "Kansas", ++i));
  g_StateMap["KS"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [411, 413, 415, 416, 417, 417, 415, 414, 414, 416, 416, 416, 417, 418, 419, 419, 420, 323, 323, 325];
  theStates[i].polys[0].ptY = [310, 309, 308, 309, 308, 307, 306, 305, 303, 302, 301, 301, 300, 299, 298, 298, 268, 268, 310, 310];
  theStates.push(new State("KY", "KENTUCKY", "Kentucky", ++i));
  g_StateMap["KY"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [560, 561, 563, 565, 567, 567, 570, 572, 573, 573, 575, 576, 576, 577, 576, 576, 577, 578, 578, 579, 580, 580, 582, 583, 583, 584, 583, 582, 581, 579, 576, 575, 574, 573, 573, 570, 569, 566, 562, 547, 505, 506, 488, 488, 489, 490, 491, 491, 491, 492, 491, 492, 496, 498, 500, 500, 499, 500, 504, 505, 504, 504, 505, 507, 507, 508, 509, 510, 511, 512, 515, 517, 518, 518, 520, 522, 522, 523, 524, 524, 525, 525, 526, 527, 528, 529, 531, 532, 533, 533, 534, 536, 537, 538, 539, 539, 539, 544, 547, 548, 547, 547, 549, 552, 552, 554, 554, 555, 559];
  theStates[i].polys[0].ptY = [293, 292, 291, 292, 291, 290, 291, 292, 293, 290, 290, 289, 287, 286, 286, 283, 282, 281, 281, 280, 279, 277, 277, 276, 276, 276, 274, 274, 273, 272, 271, 270, 269, 268, 266, 266, 265, 264, 263, 262, 263, 262, 261, 263, 262, 263, 264, 264, 266, 268, 270, 271, 271, 270, 269, 271, 272, 274, 274, 275, 276, 278, 279, 279, 281, 280, 281, 280, 282, 281, 281, 280, 279, 281, 281, 282, 281, 281, 280, 280, 281, 283, 284, 284, 283, 282, 282, 281, 282, 285, 286, 286, 287, 288, 289, 290, 292, 292, 293, 294, 296, 297, 298, 297, 297, 297, 295, 293, 293];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [486, 487, 487];
  theStates[i].polys[1].ptY = [261, 262, 261];
  theStates.push(new State("LA", "LOUISIANA", "Louisiana", ++i));
  g_StateMap["LA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [464, 465, 466, 466, 465, 466, 465, 466, 467, 466, 466, 466, 466, 467, 468, 467, 465, 467, 466, 465, 464, 464, 463, 462, 462, 462, 460, 461, 460, 461, 460, 459, 460, 458, 459, 460, 483, 483, 482, 482, 483, 484, 484, 485, 486, 484, 483, 483, 482, 482, 483, 485, 486, 486, 488, 488, 489, 490, 489, 488, 488, 485, 485, 484, 484, 485, 486, 487, 490, 490, 491, 492, 493, 492, 491, 490, 489, 488, 488, 488, 487, 486, 482, 482, 480, 480, 479, 480, 481, 479, 478, 477, 476, 476, 475, 474, 472, 472, 470, 469, 468, 467, 463, 463, 464, 461, 461, 460, 459, 456, 456, 455, 453, 452, 456, 457, 455, 451, 450, 445, 443, 440, 433, 429, 429, 430, 431, 432, 432, 431, 432, 431, 432, 433, 434, 433, 432, 431, 430, 430, 430, 429, 428, 427, 433];
  theStates[i].polys[0].ptY = [212, 211, 212, 210, 208, 208, 206, 207, 206, 205, 205, 205, 205, 204, 203, 202, 201, 200, 199, 198, 197, 195, 196, 195, 195, 193, 193, 192, 191, 190, 189, 190, 188, 188, 185, 184, 184, 181, 181, 178, 178, 177, 175, 173, 172, 172, 171, 170, 171, 169, 169, 168, 169, 170, 171, 170, 169, 170, 169, 168, 167, 166, 166, 165, 163, 162, 161, 161, 161, 161, 160, 159, 158, 158, 157, 156, 157, 156, 156, 157, 158, 159, 160, 163, 162, 160, 159, 160, 160, 159, 158, 157, 158, 160, 159, 160, 160, 159, 158, 157, 159, 159, 159, 161, 163, 163, 164, 165, 166, 166, 168, 167, 167, 166, 165, 164, 163, 164, 163, 164, 165, 166, 167, 166, 168, 169, 171, 171, 174, 176, 177, 178, 179, 181, 186, 188, 190, 191, 193, 194, 196, 197, 198, 212, 212];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [495, 494, 495];
  theStates[i].polys[1].ptY = [167, 166, 169];
  theStates.push(new State("ME", "MAINE", "Maine", ++i));
  g_StateMap["ME"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [771, 772, 772];
  theStates[i].polys[0].ptY = [372, 373, 372];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [754, 754, 754, 753, 754];
  theStates[i].polys[1].ptY = [371, 371, 369, 370, 370];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [758, 757, 758];
  theStates[i].polys[2].ptY = [368, 370, 369];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [763, 762, 763];
  theStates[i].polys[3].ptY = [369, 370, 370];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [762, 761, 762];
  theStates[i].polys[4].ptY = [368, 369, 369];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [761, 760, 760];
  theStates[i].polys[5].ptY = [369, 368, 369];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [755, 755, 756, 756, 754, 754];
  theStates[i].polys[6].ptY = [368, 368, 368, 367, 366, 368];
  theStates[i].polys.push(new poly());
  theStates[i].polys[7].ptX = [762, 761, 761];
  theStates[i].polys[7].ptY = [368, 367, 368];
  theStates[i].polys.push(new poly());
  theStates[i].polys[8].ptX = [758, 757, 758];
  theStates[i].polys[8].ptY = [366, 366, 367];
  theStates[i].polys.push(new poly());
  theStates[i].polys[9].ptX = [739, 739, 738];
  theStates[i].polys[9].ptY = [362, 362, 362];
  theStates[i].polys.push(new poly());
  theStates[i].polys[10].ptX = [738, 737, 738];
  theStates[i].polys[10].ptY = [362, 362, 362];
  theStates[i].polys.push(new poly());
  theStates[i].polys[11].ptX = [733, 735, 735, 737, 737, 736, 737, 736, 737, 739, 739, 740, 741, 742, 746, 747, 752, 752, 754, 754, 758, 761, 764, 765, 767, 767, 769, 769, 769, 769, 769, 770, 771, 773, 773, 773, 773, 773, 774, 775, 776, 778, 778, 778, 779, 778, 777, 775, 775, 774, 773, 772, 771, 770, 769, 768, 766, 766, 765, 764, 763, 763, 763, 763, 764, 762, 761, 760, 761, 760, 759, 757, 756, 755, 755, 756, 755, 753, 754, 753, 752, 752, 752, 750, 749, 748, 747, 745, 745, 744, 743, 742, 740, 739, 740, 739, 737, 737, 735, 735, 733, 732, 732, 732, 730, 729, 729, 728, 727, 727, 727, 727, 727, 726, 727, 728, 729, 729, 731, 731, 732, 731, 732, 733];
  theStates[i].polys[11].ptY = [390, 390, 392, 392, 393, 395, 396, 397, 399, 399, 400, 404, 405, 406, 410, 412, 414, 411, 411, 411, 411, 412, 413, 412, 411, 410, 409, 391, 391, 390, 389, 390, 389, 388, 387, 386, 385, 383, 382, 383, 382, 382, 381, 379, 377, 377, 376, 375, 376, 375, 375, 373, 373, 373, 374, 372, 372, 371, 372, 372, 373, 373, 372, 371, 370, 370, 369, 370, 372, 372, 370, 370, 371, 370, 372, 373, 372, 372, 371, 370, 369, 367, 367, 366, 365, 366, 364, 364, 363, 363, 362, 363, 363, 362, 364, 363, 363, 360, 360, 358, 357, 356, 355, 353, 353, 354, 356, 357, 358, 358, 359, 360, 377, 384, 385, 383, 384, 385, 386, 385, 386, 388, 389, 389];
  theStates.push(new State("MD", "MARYLAND", "Maryland", ++i));
  g_StateMap["MD"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [665, 665, 666, 674, 674, 673, 672, 667, 666, 665, 665, 663, 664, 664, 663, 663, 663, 662, 661, 661, 661, 660, 660, 659, 658, 659, 658, 658, 659, 659, 659, 658, 658, 658, 658, 659, 659, 658, 657, 657, 658, 660, 659, 659, 659, 659, 660, 661, 662, 662, 661, 661, 660, 658, 658, 657, 655, 656, 657, 656, 656, 656, 655, 655, 656, 657, 658, 657, 656, 655, 651, 650, 649, 647, 646, 646, 646, 647, 647, 648, 649, 650, 649, 648, 647, 645, 643, 642, 643, 640, 640, 639, 638, 638, 638, 638, 637, 637, 636, 635, 633, 630, 630, 628, 628, 627, 626, 625, 624, 623, 622, 621, 619, 618, 617, 617];
  theStates[i].polys[0].ptY = [306, 295, 288, 288, 286, 283, 282, 282, 281, 282, 282, 281, 282, 284, 285, 285, 285, 287, 286, 286, 285, 286, 286, 287, 289, 290, 290, 290, 291, 291, 291, 292, 291, 292, 294, 294, 294, 295, 294, 295, 296, 296, 297, 298, 298, 300, 301, 301, 302, 304, 303, 303, 302, 301, 300, 299, 299, 298, 297, 296, 294, 294, 293, 289, 288, 284, 283, 284, 284, 285, 285, 286, 287, 288, 287, 288, 289, 290, 292, 293, 294, 295, 296, 295, 296, 296, 297, 298, 299, 300, 301, 303, 304, 304, 305, 305, 304, 304, 305, 306, 306, 305, 304, 303, 304, 304, 305, 303, 302, 303, 302, 301, 301, 300, 299, 306];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [661, 662, 661];
  theStates[i].polys[1].ptY = [285, 283, 284];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [661, 662, 661];
  theStates[i].polys[2].ptY = [282, 281, 281];
  theStates.push(new State("MA", "MASSACHUSETTS", "Massachusetts", ++i));
  g_StateMap["MA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [729, 730, 730, 731, 732, 729, 728, 728, 727, 727, 730, 731, 731, 731, 731, 733, 733, 734, 737, 740, 740, 739, 737, 737, 739, 740, 740, 741, 740, 735, 735, 732, 730, 730, 731, 732, 732, 730, 729, 729, 728, 725, 725, 724, 723, 723, 722, 705, 704, 703, 694, 695, 696, 697, 725, 726, 728];
  theStates[i].polys[0].ptY = [350, 349, 348, 347, 346, 346, 345, 344, 343, 343, 342, 341, 339, 339, 337, 337, 335, 334, 334, 335, 337, 339, 339, 338, 339, 338, 337, 333, 333, 333, 332, 332, 331, 330, 331, 332, 334, 334, 333, 333, 332, 331, 333, 335, 335, 336, 337, 338, 339, 338, 339, 342, 345, 348, 348, 349, 350];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [732, 733, 733, 734, 730, 730, 730, 731];
  theStates[i].polys[1].ptY = [330, 331, 329, 329, 329, 328, 329, 330];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [739, 740, 740, 738, 738];
  theStates[i].polys[2].ptY = [328, 329, 328, 327, 328];
  theStates.push(new State("MI", "MICHIGAN", "Michigan", ++i));
  g_StateMap["MI"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [550, 553, 551, 550];
  theStates[i].polys[0].ptY = [391, 391, 390, 391];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [531, 533, 533, 535, 535, 536, 537, 538, 537, 537, 537, 538, 539, 538, 539, 540, 542, 546, 544, 544, 544, 545, 545, 547, 548, 549, 551, 555, 556, 560, 562, 565, 566, 566, 567, 567, 565, 565, 566, 567, 566, 564, 564, 562, 560, 559, 559, 562, 562, 564, 565, 566, 567, 568, 571, 573, 575, 575, 576, 577, 578, 579, 578, 577, 575, 575, 575, 574, 574, 573, 573, 572, 570, 570, 569, 568, 567, 566, 565, 548, 523, 524, 524, 525, 526, 527, 528, 529, 528, 527, 526, 525, 526, 525, 526, 527, 528, 529, 531, 531];
  theStates[i].polys[1].ptY = [379, 379, 379, 379, 381, 382, 383, 382, 381, 381, 377, 380, 378, 377, 379, 384, 384, 385, 386, 387, 388, 389, 390, 391, 390, 391, 390, 389, 387, 387, 386, 385, 384, 382, 381, 380, 381, 379, 378, 371, 370, 370, 367, 367, 366, 365, 361, 361, 360, 361, 362, 363, 364, 365, 366, 367, 366, 364, 360, 354, 352, 352, 348, 346, 346, 347, 347, 348, 347, 346, 344, 343, 343, 342, 338, 337, 336, 336, 334, 334, 335, 336, 337, 339, 340, 342, 344, 354, 355, 357, 360, 362, 366, 367, 368, 369, 370, 376, 376, 377];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [538, 539, 537, 537, 538, 538];
  theStates[i].polys[2].ptY = [390, 389, 388, 390, 391, 390];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [532, 531, 532];
  theStates[i].polys[3].ptY = [381, 382, 382];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [530, 531, 531];
  theStates[i].polys[4].ptY = [380, 381, 380];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [495, 494, 490, 491, 494, 497, 500, 501, 499, 498, 496];
  theStates[i].polys[5].ptY = [422, 421, 420, 421, 422, 423, 424, 425, 424, 423, 422];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [475, 476, 480, 481, 483, 485, 485, 489, 491, 494, 494, 496, 499, 500, 501, 504, 509, 509, 508, 508, 506, 504, 503, 502, 501, 500, 500, 501, 502, 504, 504, 507, 510, 511, 512, 513, 514, 520, 521, 522, 523, 524, 526, 527, 533, 535, 536, 537, 538, 541, 546, 545, 544, 547, 548, 550, 552, 555, 555, 556, 556, 557, 557, 555, 556, 556, 557, 558, 561, 560, 560, 564, 565, 560, 559, 559, 558, 555, 552, 550, 549, 549, 549, 547, 546, 544, 537, 536, 536, 533, 531, 530, 528, 527, 526, 526, 525, 524, 523, 524, 525, 525, 524, 522, 521, 520, 519, 518, 517, 516, 515, 514, 513, 512, 511, 509, 510, 510, 508, 508, 509, 509, 509, 508, 504, 505, 502, 495, 493, 489, 484, 480, 478, 477, 476, 475, 475];
  theStates[i].polys[6].ptY = [402, 402, 403, 404, 405, 406, 406, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 414, 413, 414, 413, 412, 411, 410, 409, 408, 405, 406, 407, 407, 407, 407, 406, 405, 404, 403, 402, 401, 400, 401, 402, 400, 401, 402, 403, 404, 403, 404, 403, 404, 405, 402, 401, 401, 400, 401, 400, 401, 402, 401, 399, 399, 398, 397, 396, 397, 396, 395, 394, 395, 396, 395, 394, 393, 394, 394, 393, 394, 393, 394, 395, 393, 393, 392, 393, 394, 395, 394, 394, 394, 393, 394, 393, 392, 391, 390, 390, 389, 390, 391, 391, 393, 392, 392, 391, 390, 392, 390, 389, 388, 386, 385, 383, 382, 382, 382, 383, 385, 385, 387, 388, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 400, 400, 401, 402, 402];
  theStates.push(new State("MN", "MINNESOTA", "Minnesota", ++i));
  g_StateMap["MN"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [413, 417, 417, 418, 419, 420, 425, 430, 430, 434, 436, 436, 442, 446, 445, 448, 448, 449, 450, 454, 454, 455, 458, 458, 459, 460, 464, 466, 469, 469, 470, 472, 473, 474, 474, 477, 477, 478, 480, 485, 483, 480, 476, 472, 470, 469, 467, 465, 464, 463, 462, 460, 459, 457, 455, 454, 453, 452, 450, 450, 447, 445, 444, 444, 443, 443, 445, 445, 445, 445, 444, 444, 445, 446, 450, 451, 453, 455, 455, 456, 458, 459, 462, 463, 463, 464, 464, 464, 396, 396, 394, 392, 392, 391, 392, 394, 394, 395, 394, 395, 394, 393, 392, 391, 390, 390, 389, 389, 388, 387, 388, 387, 386, 413, 413];
  theStates[i].polys[0].ptY = [441, 441, 440, 436, 433, 432, 432, 431, 430, 429, 430, 431, 431, 430, 429, 428, 426, 425, 427, 427, 426, 425, 425, 424, 423, 423, 423, 424, 425, 425, 423, 423, 424, 423, 423, 423, 424, 423, 423, 422, 421, 420, 419, 418, 417, 416, 415, 414, 413, 412, 411, 410, 409, 408, 407, 406, 404, 404, 403, 394, 394, 393, 392, 390, 389, 389, 388, 386, 386, 384, 377, 377, 376, 375, 374, 373, 372, 371, 369, 368, 368, 367, 366, 365, 363, 362, 361, 359, 359, 385, 385, 386, 388, 389, 390, 390, 392, 394, 394, 396, 399, 401, 408, 417, 417, 419, 419, 421, 423, 431, 432, 434, 436, 436, 439];
  theStates.push(new State("MS", "MISSISSIPPI", "Mississippi", ++i));
  g_StateMap["MS"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [504, 505, 505, 504, 503, 502, 501, 500, 501, 500, 495, 495, 494, 490, 489, 489, 488, 487, 485, 485, 484, 483, 482, 482, 483, 483, 460, 459, 459, 460, 460, 460, 461, 460, 461, 460, 462, 462, 462, 463, 464, 464, 465, 466, 467, 465, 467, 468, 467, 466, 466, 466, 466, 467, 466, 465, 465, 465, 465, 466, 465, 464, 465, 464, 466, 466, 465, 466, 465, 464, 465, 464, 464, 465, 464, 465, 467, 465, 466, 466, 466, 467, 467, 468, 468, 469, 469, 470, 471, 471, 472, 472, 473, 472, 472, 473, 474, 473, 474, 476, 477, 500];
  theStates[i].polys[0].ptY = [240, 239, 237, 228, 220, 211, 202, 184, 175, 174, 175, 175, 175, 175, 174, 175, 174, 173, 173, 175, 177, 178, 178, 181, 181, 184, 184, 185, 187, 188, 189, 190, 189, 190, 191, 192, 193, 195, 195, 196, 195, 197, 197, 198, 199, 200, 201, 202, 203, 204, 205, 205, 205, 206, 207, 206, 207, 208, 210, 212, 211, 212, 213, 214, 214, 216, 217, 218, 217, 218, 218, 219, 219, 220, 221, 222, 221, 222, 223, 225, 225, 226, 226, 226, 227, 228, 229, 230, 231, 231, 232, 232, 233, 234, 236, 235, 236, 236, 238, 238, 239, 240];
  theStates.push(new State("MO", "MISSOURI", "Missouri", ++i));
  g_StateMap["MO"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [458, 459, 460, 461, 461, 461, 460, 461, 461, 462, 462, 463, 464, 466, 466, 468, 469, 471, 471, 472, 473, 474, 477, 479, 478, 478, 478, 477, 476, 475, 476, 477, 478, 480, 480, 481, 481, 482, 482, 484, 484, 486, 487, 486, 487, 488, 487, 487, 487, 488, 490, 490, 492, 492, 491, 491, 490, 489, 488, 488, 487, 486, 485, 486, 485, 484, 485, 484, 475, 476, 477, 478, 479, 479, 478, 420, 420, 419, 418, 417, 416, 416, 416, 415, 414, 415, 417, 417, 416, 415, 413, 412, 410, 410, 409, 408, 406, 407, 406, 406, 406, 405, 455, 456];
  theStates[i].polys[0].ptY = [319, 318, 317, 316, 315, 313, 311, 309, 309, 308, 306, 305, 305, 304, 302, 302, 301, 300, 295, 294, 295, 295, 295, 294, 293, 292, 290, 289, 287, 285, 284, 283, 282, 282, 281, 281, 281, 280, 280, 280, 278, 278, 277, 276, 275, 274, 273, 272, 270, 268, 268, 269, 268, 267, 264, 264, 263, 262, 263, 261, 262, 259, 258, 257, 258, 257, 255, 254, 254, 255, 256, 257, 258, 260, 261, 261, 298, 298, 299, 300, 301, 301, 302, 302, 305, 306, 306, 307, 308, 309, 308, 309, 310, 312, 313, 314, 314, 316, 316, 317, 318, 317, 318, 319];
  theStates.push(new State("MT", "MONTANA", "Montana", ++i));
  g_StateMap["MT"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [297, 297, 206, 206, 205, 204, 203, 202, 202, 201, 200, 197, 196, 194, 194, 193, 192, 189, 189, 188, 187, 184, 183, 181, 181, 180, 179, 178, 176, 175, 175, 174, 173, 172, 171, 170, 170, 169, 168, 167, 165, 165, 164, 162, 161, 162, 161, 161, 163, 163, 162, 162, 162, 163, 163, 164, 160, 158, 156, 156, 155, 154, 153, 152, 151, 148, 147, 146, 146, 146, 146, 145, 144, 143, 142, 141, 141];
  theStates[i].polys[0].ptY = [436, 380, 380, 373, 374, 375, 375, 376, 376, 375, 374, 374, 373, 374, 373, 373, 373, 374, 372, 373, 373, 373, 371, 372, 374, 376, 377, 377, 377, 378, 381, 382, 383, 384, 387, 388, 388, 389, 390, 389, 388, 387, 386, 387, 388, 389, 390, 392, 392, 393, 396, 396, 398, 401, 401, 403, 403, 404, 405, 407, 408, 409, 410, 411, 412, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 436];
  theStates.push(new State("NE", "NEBRASKA", "Nebraska", ++i));
  g_StateMap["NE"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [370, 372, 374, 377, 386, 389, 392, 393, 394, 397, 397, 398, 397, 399, 399, 400, 400, 401, 400, 400, 401, 402, 402, 403, 403, 404, 404, 404, 405, 405, 406, 407, 406, 407, 407, 408, 409, 410, 410, 323, 323, 297, 297, 307];
  theStates[i].polys[0].ptY = [352, 351, 350, 349, 350, 349, 348, 347, 346, 345, 342, 341, 340, 340, 339, 338, 336, 334, 333, 333, 332, 331, 330, 328, 328, 327, 320, 320, 319, 317, 318, 318, 316, 316, 315, 314, 313, 312, 310, 310, 324, 324, 352, 352];
  theStates.push(new State("NV", "NEVADA", "Nevada", ++i));
  g_StateMap["NV"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [167, 167, 166, 166, 165, 164, 159, 158, 158, 159, 159, 160, 159, 160, 161, 160, 159, 157, 156, 154, 153, 151, 150, 150, 148, 147, 145, 144, 143, 142, 141, 139, 139, 137, 136, 135, 133, 130, 129, 127, 126, 125, 124, 122, 121, 120, 117, 116, 115, 113, 109, 108, 107, 105, 104, 103, 102, 101, 99, 98, 97, 95, 94, 92, 91, 90, 129];
  theStates[i].polys[0].ptY = [338, 256, 255, 255, 254, 256, 256, 254, 254, 253, 249, 249, 246, 243, 242, 240, 241, 242, 243, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 263, 265, 266, 267, 268, 269, 270, 271, 272, 273, 275, 276, 277, 279, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 296, 338, 338];
  theStates.push(new State("NH", "NEW HAMPSHIRE", "New Hampshire", ++i));
  g_StateMap["NH"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [726, 727, 727, 728, 727, 728, 729, 729, 730, 731, 730, 729, 726, 725, 708, 707, 707, 708, 709, 710, 711, 712, 713, 713, 713, 713, 713, 714, 717, 719, 720, 720, 719, 719, 720, 720, 721, 721, 722, 722, 724, 724, 725, 726];
  theStates[i].polys[0].ptY = [377, 360, 360, 359, 358, 357, 356, 354, 353, 352, 351, 350, 350, 349, 348, 349, 352, 356, 360, 362, 363, 365, 366, 366, 367, 368, 370, 371, 371, 372, 373, 374, 375, 377, 379, 379, 380, 381, 382, 383, 384, 384, 384, 384];
  theStates.push(new State("NJ", "NEW JERSEY", "New Jersey", ++i));
  g_StateMap["NJ"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [686, 688, 689, 689, 688, 687, 685, 685, 685, 688, 688, 687, 686, 685, 684, 683, 681, 680, 679, 679, 678, 677, 675, 676, 676, 673, 671, 669, 668, 668, 669, 670, 673, 673, 675, 677, 678, 677, 676, 676, 674, 674, 672, 673, 672, 674, 674, 673, 674, 675, 676, 677, 678, 680, 682, 684, 685];
  theStates[i].polys[0].ptY = [326, 325, 324, 322, 320, 319, 319, 317, 317, 316, 311, 306, 305, 303, 302, 301, 301, 300, 299, 297, 296, 295, 295, 296, 299, 299, 300, 301, 302, 306, 307, 308, 308, 310, 310, 311, 312, 313, 314, 315, 316, 318, 318, 319, 320, 321, 323, 324, 324, 326, 326, 328, 329, 329, 328, 327, 326];
  theStates.push(new State("NM", "NEW MEXICO", "New Mexico", ++i));
  g_StateMap["NM"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [311, 311, 310, 264, 264, 243, 243, 232, 232, 254];
  theStates[i].polys[0].ptY = [268, 261, 198, 198, 195, 195, 189, 189, 268, 268];
  theStates.push(new State("NY", "NEW YORK", "New York", ++i));
  g_StateMap["NY"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [697, 696, 696, 696, 696, 697, 696, 695, 696, 695, 696, 697, 698, 698, 697, 697, 697, 696, 695, 695, 695, 694, 694, 692, 692, 691, 691, 691, 693, 699, 700, 700, 702, 703, 707, 709, 710, 711, 712, 712, 714, 715, 712, 710, 707, 704, 701, 695, 688, 688, 688, 689, 688, 686, 684, 682, 680, 679, 676, 675, 674, 674, 671, 671, 613, 613, 615, 617, 618, 620, 622, 622, 624, 625, 624, 623, 622, 625, 640, 641, 642, 652, 653, 655, 659, 659, 660, 660, 658, 657, 657, 660, 661, 663, 664, 665, 667, 667, 669, 671, 673, 675, 697];
  theStates[i].polys[0].ptY = [380, 379, 377, 377, 374, 369, 367, 366, 361, 361, 360, 361, 360, 353, 348, 348, 346, 343, 340, 339, 336, 327, 327, 326, 323, 322, 322, 322, 322, 323, 324, 324, 324, 323, 324, 325, 326, 325, 324, 324, 324, 325, 324, 323, 322, 321, 320, 319, 318, 319, 322, 324, 325, 325, 326, 327, 328, 329, 330, 331, 332, 336, 336, 337, 338, 342, 342, 343, 344, 345, 346, 348, 348, 350, 351, 353, 356, 356, 357, 356, 355, 356, 357, 358, 359, 364, 364, 366, 366, 367, 368, 369, 370, 371, 373, 373, 374, 375, 376, 377, 378, 379, 380];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [714, 714, 715];
  theStates[i].polys[1].ptY = [328, 328, 328];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [712, 713, 713];
  theStates[i].polys[2].ptY = [325, 326, 325];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [687, 686, 685, 687];
  theStates[i].polys[3].ptY = [318, 317, 319, 319];
  theStates.push(new State("NC", "NORTH CAROLINA", "North Carolina", ++i));
  g_StateMap["NC"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [664, 664, 665, 666, 667, 668, 667, 666, 665, 664, 663, 662, 663, 664, 665, 664, 662, 661, 660, 656, 654, 654, 653, 656, 657, 658, 662, 663, 664, 665, 666, 665, 666, 665, 663, 662, 661, 655, 656, 655, 654, 656, 656, 658, 658, 657, 658, 659, 661, 662, 660, 659, 658, 657, 656, 655, 654, 650, 646, 645, 643, 641, 640, 639, 638, 638, 637, 636, 631, 628, 627, 626, 625, 624, 623, 622, 621, 620, 619, 618, 616, 615, 600, 600, 599, 598, 597, 588, 578, 575, 572, 554, 554, 555, 556, 557, 558, 559, 560, 565, 567, 569, 572, 572, 574, 575, 576, 576, 577, 578, 579, 582, 583, 583, 584, 585, 586, 587, 588, 588, 597];
  theStates[i].polys[0].ptY = [262, 259, 256, 254, 253, 252, 254, 255, 257, 260, 261, 260, 258, 256, 255, 256, 256, 257, 256, 255, 254, 254, 253, 253, 254, 253, 254, 253, 254, 253, 252, 251, 250, 249, 248, 247, 246, 245, 243, 241, 240, 240, 240, 240, 238, 238, 239, 239, 240, 241, 240, 239, 238, 236, 235, 235, 235, 236, 235, 234, 233, 232, 231, 230, 229, 227, 224, 224, 225, 224, 225, 226, 227, 228, 229, 231, 232, 232, 233, 234, 235, 236, 237, 239, 241, 241, 241, 242, 243, 242, 241, 240, 243, 243, 244, 244, 246, 247, 248, 248, 249, 250, 251, 253, 253, 254, 255, 253, 254, 255, 256, 256, 255, 256, 257, 258, 259, 259, 260, 262, 262];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [667, 666, 667];
  theStates[i].polys[1].ptY = [251, 253, 253];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [668, 665, 663, 662, 664, 667, 668, 668, 669, 668, 669, 668];
  theStates[i].polys[2].ptY = [243, 243, 242, 241, 242, 243, 244, 246, 249, 250, 245, 244];
  theStates.push(new State("ND", "NORTH DAKOTA", "North Dakota", ++i));
  g_StateMap["ND"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [386, 386, 387, 388, 387, 388, 389, 390, 390, 391, 391, 392, 393, 394, 395, 395, 297, 297, 383];
  theStates[i].polys[0].ptY = [436, 434, 432, 431, 423, 421, 419, 419, 417, 417, 407, 401, 399, 396, 395, 394, 393, 436, 436];
  theStates.push(new State("OH", "OHIO", "Ohio", ++i));
  g_StateMap["OH"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [603, 602, 602, 602, 601, 600, 600, 599, 599, 598, 596, 596, 594, 592, 591, 590, 588, 587, 587, 587, 587, 586, 585, 583, 582, 582, 581, 582, 580, 580, 576, 575, 573, 573, 572, 570, 568, 567, 565, 563, 561, 560, 555, 555, 554, 552, 552, 549, 547, 547, 548, 567, 570, 571, 573, 575, 575, 577, 578, 581, 589, 590, 591, 593, 596, 599, 603, 603];
  theStates[i].polys[0].ptY = [319, 318, 318, 313, 311, 309, 309, 308, 305, 304, 304, 303, 302, 301, 302, 301, 300, 299, 297, 297, 295, 294, 296, 296, 295, 293, 292, 290, 290, 288, 288, 289, 290, 293, 292, 292, 291, 291, 291, 292, 291, 292, 293, 295, 297, 297, 297, 297, 298, 312, 334, 334, 333, 332, 331, 332, 330, 330, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [573, 574, 574];
  theStates[i].polys[1].ptY = [333, 334, 333];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [575, 574, 575];
  theStates[i].polys[2].ptY = [332, 332, 333];
  theStates.push(new State("OK", "OKLAHOMA", "Oklahoma", ++i));
  g_StateMap["OK"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [420, 420, 421, 422, 420, 420, 418, 418, 417, 416, 414, 411, 408, 406, 406, 405, 400, 399, 399, 398, 397, 395, 395, 394, 393, 390, 389, 388, 388, 387, 386, 387, 386, 384, 383, 383, 381, 380, 379, 376, 377, 375, 375, 371, 369, 364, 360, 360, 360, 358, 357, 355, 354, 353, 352, 350, 350, 311, 311, 349];
  theStates[i].polys[0].ptY = [268, 257, 251, 221, 221, 222, 222, 222, 223, 224, 224, 225, 224, 225, 225, 224, 224, 223, 223, 222, 223, 223, 223, 225, 224, 224, 225, 224, 222, 223, 224, 225, 224, 224, 223, 225, 225, 226, 225, 224, 225, 226, 227, 228, 227, 228, 229, 231, 231, 232, 231, 232, 231, 232, 234, 234, 261, 261, 268, 268];
  theStates.push(new State("OR", "OREGON", "Oregon", ++i));
  g_StateMap["OR"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [48, 49, 51, 53, 53, 54, 54, 56, 63, 65, 73, 74, 75, 79, 87, 90, 94, 102, 130, 131, 132, 132, 133, 135, 135, 136, 135, 134, 133, 132, 131, 130, 129, 128, 127, 126, 127, 128, 130, 130, 130, 129, 129, 35, 34, 33, 32, 33, 33, 33, 32, 31, 32, 33, 34, 35, 36, 37, 37, 37, 38, 38, 39, 39, 38, 39, 38, 39, 40, 44, 45, 45, 48];
  theStates[i].polys[0].ptY = [396, 397, 396, 395, 393, 393, 389, 389, 388, 389, 390, 389, 389, 389, 390, 391, 392, 393, 394, 393, 392, 392, 391, 391, 389, 388, 386, 385, 382, 381, 378, 377, 376, 375, 373, 371, 371, 370, 369, 367, 367, 366, 338, 338, 339, 342, 344, 344, 345, 347, 348, 351, 354, 357, 358, 362, 368, 369, 370, 378, 386, 386, 387, 390, 394, 396, 397, 396, 397, 397, 398, 397, 396];
  theStates.push(new State("PA", "PENNSYLVANIA", "Pennsylvania", ++i));
  g_StateMap["PA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [613, 671, 671, 674, 674, 675, 676, 679, 678, 677, 677, 675, 675, 673, 674, 674, 672, 673, 672, 674, 674, 675, 676, 677, 678, 677, 675, 673, 673, 670, 669, 666, 665, 603, 603, 606, 608, 610, 612, 613];
  theStates[i].polys[0].ptY = [338, 338, 337, 336, 332, 331, 330, 330, 329, 328, 327, 326, 325, 324, 323, 321, 321, 320, 319, 318, 316, 316, 314, 313, 312, 312, 311, 310, 308, 308, 307, 308, 307, 306, 338, 338, 339, 340, 341, 342];
  theStates.push(new State("RI", "RHODE ISLAND", "Rhode Island", ++i));
  g_StateMap["RI"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [722, 723, 722, 724, 724, 723, 722, 722, 721, 722, 722, 721, 721, 717, 716, 717, 720];
  theStates[i].polys[0].ptY = [338, 337, 336, 335, 333, 333, 334, 334, 333, 332, 332, 331, 329, 329, 330, 338, 338];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [725, 725, 724, 724, 724, 723, 722, 723, 724];
  theStates[i].polys[1].ptY = [333, 330, 331, 331, 331, 330, 331, 333, 333];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [723, 723, 722];
  theStates[i].polys[2].ptY = [333, 333, 333];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [719, 720, 720];
  theStates[i].polys[3].ptY = [326, 327, 326];
  theStates.push(new State("SC", "SOUTH CAROLINA", "South Carolina", ++i));
  g_StateMap["SC"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [575, 578, 588, 597, 598, 598, 599, 600, 615, 616, 617, 618, 619, 621, 622, 622, 624, 625, 626, 627, 628, 628, 626, 624, 624, 623, 622, 621, 619, 619, 615, 615, 614, 612, 611, 610, 607, 604, 604, 602, 601, 599, 598, 598, 596, 595, 595, 595, 593, 592, 592, 592, 592, 591, 591, 590, 588, 587, 586, 585, 585, 584, 582, 581, 581, 580, 578, 577, 576, 575, 574, 574, 573, 570, 569, 569, 568, 567, 567, 567, 568, 568, 569, 571, 574];
  theStates[i].polys[0].ptY = [241, 242, 243, 242, 241, 241, 240, 237, 237, 236, 235, 234, 233, 232, 231, 230, 229, 228, 227, 226, 225, 224, 223, 222, 221, 219, 218, 214, 214, 213, 212, 211, 210, 209, 208, 207, 206, 205, 202, 202, 200, 200, 199, 199, 199, 200, 204, 204, 205, 206, 208, 208, 209, 210, 211, 212, 213, 214, 215, 216, 219, 220, 220, 221, 223, 224, 224, 225, 226, 227, 228, 231, 233, 233, 234, 235, 235, 236, 236, 237, 238, 238, 239, 240, 241];
  theStates.push(new State("SD", "SOUTH DAKOTA", "South Dakota", ++i));
  g_StateMap["SD"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [395, 394, 394, 392, 391, 392, 392, 394, 396, 396, 394, 395, 395, 395, 396, 396, 395, 395, 395, 394, 395, 395, 396, 394, 393, 392, 389, 386, 377, 374, 372, 370, 297, 297];
  theStates[i].polys[0].ptY = [393, 392, 390, 390, 389, 388, 386, 386, 385, 359, 359, 358, 356, 356, 355, 353, 352, 352, 350, 348, 347, 347, 346, 345, 346, 347, 348, 349, 350, 349, 350, 351, 352, 393];
  theStates.push(new State("TN", "TENNESSEE", "Tennessee", ++i));
  g_StateMap["TN"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [506, 505, 546, 585, 589, 588, 587, 586, 585, 584, 583, 583, 582, 579, 578, 577, 576, 576, 575, 574, 572, 572, 569, 567, 565, 560, 559, 558, 558, 557, 556, 555, 554, 476, 477, 477, 478, 479, 479, 479, 479, 478, 479, 480, 479, 481, 481, 481, 481, 482, 484, 483, 484, 485, 484, 484, 485, 485, 484, 485, 486, 485, 486, 487, 505];
  theStates[i].polys[0].ptY = [261, 262, 263, 262, 263, 260, 259, 259, 258, 257, 256, 255, 256, 256, 255, 254, 253, 255, 254, 253, 253, 251, 251, 250, 249, 248, 247, 246, 244, 244, 243, 243, 240, 240, 241, 241, 242, 243, 243, 244, 246, 247, 246, 247, 248, 248, 249, 249, 251, 251, 251, 252, 253, 252, 253, 254, 255, 257, 257, 257, 258, 259, 261, 261, 261];
  theStates.push(new State("TX", "TEXAS", "Texas", ++i));
  g_StateMap["TX"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [350, 350, 352, 352, 354, 355, 357, 358, 360, 360, 360, 364, 369, 371, 375, 375, 377, 376, 379, 380, 381, 383, 383, 384, 386, 387, 386, 387, 388, 388, 389, 390, 393, 394, 394, 395, 397, 398, 399, 399, 400, 405, 406, 406, 408, 411, 414, 416, 417, 417, 418, 420, 420, 422, 427, 427, 428, 429, 430, 431, 430, 431, 432, 433, 434, 433, 432, 431, 432, 431, 432, 431, 431, 430, 429, 430, 429, 428, 426, 423, 420, 419, 418, 419, 422, 419, 418, 419, 419, 417, 417, 416, 415, 416, 417, 418, 417, 415, 414, 413, 412, 410, 408, 407, 406, 403, 401, 399, 397, 397, 398, 399, 402, 400, 399, 399, 398, 397, 396, 395, 393, 394, 395, 397, 395, 393, 392, 392, 392, 391, 389, 389, 388, 387, 384, 384, 386, 385, 385, 384, 383, 382, 381, 382, 384, 383, 382, 383, 384, 383, 384, 385, 385, 385, 386, 387, 384, 382, 381, 379, 372, 371, 368, 368, 367, 366, 364, 362, 361, 361, 360, 359, 358, 357, 356, 357, 356, 355, 354, 353, 352, 351, 350, 349, 348, 347, 346, 345, 345, 344, 343, 343, 342, 341, 340, 338, 337, 336, 334, 334, 333, 332, 322, 319, 316, 315, 314, 314, 313, 313, 312, 312, 312, 311, 310, 307, 306, 306, 305, 302, 301, 298, 296, 295, 293, 292, 291, 291, 290, 289, 288, 287, 286, 285, 283, 281, 281, 280, 278, 277, 277, 275, 274, 273, 272, 270, 269, 268, 267, 266, 264, 264, 310, 310, 326];
  theStates[i].polys[0].ptY = [261, 234, 234, 233, 232, 231, 232, 231, 232, 231, 229, 229, 228, 227, 228, 227, 226, 225, 224, 225, 226, 225, 223, 224, 224, 225, 224, 223, 222, 224, 225, 224, 224, 225, 224, 223, 223, 222, 223, 223, 224, 224, 225, 225, 225, 224, 225, 224, 223, 222, 222, 222, 221, 221, 220, 198, 197, 196, 194, 194, 192, 191, 188, 186, 181, 179, 178, 177, 176, 174, 171, 171, 169, 168, 166, 165, 166, 166, 165, 164, 163, 162, 161, 162, 163, 164, 163, 164, 167, 167, 165, 166, 163, 160, 161, 161, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 149, 148, 148, 149, 149, 150, 151, 150, 151, 152, 151, 151, 151, 152, 150, 149, 149, 148, 147, 148, 146, 146, 145, 144, 142, 141, 140, 140, 138, 138, 137, 135, 132, 132, 133, 132, 131, 132, 128, 125, 122, 121, 120, 119, 119, 118, 115, 114, 113, 113, 112, 113, 114, 115, 116, 117, 117, 118, 119, 119, 120, 121, 123, 126, 127, 128, 132, 133, 135, 137, 137, 137, 139, 140, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 154, 156, 158, 160, 160, 161, 162, 163, 165, 165, 167, 167, 168, 167, 166, 165, 163, 163, 161, 159, 159, 158, 157, 156, 156, 157, 156, 158, 158, 159, 160, 161, 162, 163, 164, 165, 167, 168, 174, 175, 177, 178, 180, 180, 181, 182, 183, 183, 184, 186, 186, 187, 188, 189, 190, 192, 193, 195, 194, 195, 198, 198, 261, 261];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [388, 387, 388, 389, 390, 391, 393, 395, 397, 395, 393, 392, 391, 390, 389, 388, 387, 386, 385, 384, 385, 386, 387, 386, 385, 384, 385, 386, 387, 388];
  theStates[i].polys[1].ptY = [140, 140, 140, 142, 144, 144, 145, 146, 147, 146, 145, 144, 143, 142, 140, 139, 137, 135, 133, 125, 122, 118, 117, 121, 124, 133, 135, 138, 139, 140];
  theStates.push(new State("UT", "UTAH", "Utah", ++i));
  g_StateMap["UT"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [206, 206, 232, 232, 167, 167, 192];
  theStates[i].polys[0].ptY = [338, 324, 324, 268, 268, 338, 338];
  theStates.push(new State("VT", "VERMONT", "Vermont", ++i));
  g_StateMap["VT"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [720, 720, 720, 719, 720, 720, 719, 717, 714, 714, 713, 713, 713, 713, 712, 712, 711, 710, 709, 708, 707, 708, 697, 697, 698, 697, 696, 696, 696, 696, 695, 696, 697, 696, 696, 696, 697, 697];
  theStates[i].polys[0].ptY = [380, 379, 377, 375, 374, 374, 373, 372, 371, 370, 368, 368, 367, 366, 365, 363, 362, 360, 356, 352, 349, 348, 348, 353, 360, 361, 360, 360, 361, 366, 367, 369, 374, 377, 377, 379, 380, 380];
  theStates.push(new State("VA", "VIRGINIA", "Virginia", ++i));
  g_StateMap["VA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [631, 633, 634, 636, 637, 639, 639, 640, 643, 642, 643, 645, 647, 648, 649, 648, 647, 646, 645, 645, 648, 648, 649, 650, 650, 654, 655, 657, 659, 659, 658, 655, 655, 653, 652, 654, 654, 656, 657, 659, 659, 658, 657, 657, 656, 657, 658, 658, 657, 656, 654, 654, 652, 653, 653, 654, 655, 656, 658, 659, 662, 662, 663, 588, 585, 562, 566, 569, 570, 573, 573, 574, 575, 576, 578, 580, 581, 583, 583, 584, 584, 585, 586, 587, 590, 592, 592, 594, 594, 598, 599, 600, 601, 602, 603, 605, 606, 606, 607, 606, 607, 608, 609, 610, 611, 612, 613, 614, 614, 616, 617, 620, 620, 621, 622, 623, 625, 626, 628, 629, 630, 631, 631, 631, 632, 631, 631];
  theStates[i].polys[0].ptY = [303, 302, 301, 300, 299, 298, 300, 300, 300, 299, 298, 297, 296, 295, 294, 293, 292, 291, 290, 287, 287, 288, 286, 285, 285, 284, 283, 282, 281, 279, 277, 277, 279, 279, 280, 279, 277, 277, 276, 275, 273, 273, 273, 273, 272, 271, 270, 268, 267, 269, 269, 271, 271, 270, 269, 268, 268, 267, 267, 268, 267, 265, 263, 262, 263, 262, 263, 264, 265, 266, 268, 269, 270, 271, 271, 272, 273, 274, 275, 275, 275, 274, 273, 272, 271, 272, 273, 272, 271, 272, 274, 273, 274, 274, 275, 274, 275, 276, 277, 278, 280, 281, 281, 283, 285, 286, 286, 287, 290, 290, 289, 288, 290, 291, 293, 294, 293, 294, 295, 296, 297, 298, 299, 301, 301, 302, 303];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [671, 671, 669, 668, 667, 667, 666, 665, 664, 662, 662, 663, 663, 664, 666, 666, 667, 670];
  theStates[i].polys[1].ptY = [282, 281, 280, 279, 278, 275, 273, 271, 270, 270, 274, 275, 277, 278, 279, 281, 281, 282];
  theStates.push(new State("WA", "WASHINGTON", "Washington", ++i));
  g_StateMap["WA"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [129, 129, 128, 128, 129, 129, 130, 130, 130, 103, 95, 90, 88, 80, 75, 75, 74, 66, 63, 56, 54, 54, 53, 53, 51, 50, 49, 46, 45, 40, 39, 37, 37, 37, 38, 38, 39, 39, 39, 37, 37, 36, 37, 40, 38, 36, 36, 35, 34, 33, 32, 30, 29, 29, 29, 29, 32, 35, 37, 50, 53, 54, 55, 55, 56, 55, 54, 55, 55, 56, 57, 58, 58, 57, 58, 57, 58, 59, 57, 59, 60, 59, 59, 60, 59, 59, 60, 61, 60, 59, 58, 59, 58, 57, 59, 57, 55, 55, 57, 57, 58, 58, 57, 58, 56, 55, 55, 54, 53, 60];
  theStates[i].polys[0].ptY = [436, 425, 400, 400, 399, 398, 397, 395, 395, 394, 393, 392, 391, 390, 389, 388, 389, 390, 389, 388, 389, 393, 393, 395, 395, 396, 397, 396, 398, 398, 397, 398, 403, 403, 402, 401, 404, 404, 404, 404, 406, 407, 407, 407, 408, 409, 410, 412, 415, 418, 420, 420, 421, 424, 424, 427, 427, 426, 425, 424, 423, 424, 423, 421, 421, 420, 419, 418, 419, 420, 421, 420, 418, 417, 417, 416, 415, 414, 413, 412, 413, 414, 416, 417, 417, 420, 421, 423, 423, 425, 424, 423, 424, 426, 426, 427, 428, 429, 429, 428, 430, 430, 431, 432, 433, 432, 433, 434, 435, 436];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [56, 56, 55];
  theStates[i].polys[1].ptY = [432, 431, 432];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [51, 50, 51];
  theStates[i].polys[2].ptY = [432, 432, 432];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [51, 51, 54, 53, 54, 53, 50, 49, 48, 50, 51];
  theStates[i].polys[3].ptY = [430, 431, 432, 431, 429, 428, 428, 429, 430, 431, 430];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [49, 48, 49];
  theStates[i].polys[4].ptY = [431, 431, 432];
  theStates[i].polys.push(new poly());
  theStates[i].polys[5].ptX = [55, 55, 55];
  theStates[i].polys[5].ptY = [430, 430, 431];
  theStates[i].polys.push(new poly());
  theStates[i].polys[6].ptX = [56, 56, 56, 56];
  theStates[i].polys[6].ptY = [430, 429, 429, 430];
  theStates[i].polys.push(new poly());
  theStates[i].polys[7].ptX = [55, 56, 57, 56, 56, 57, 59, 59, 58, 56, 56, 55, 54, 55];
  theStates[i].polys[7].ptY = [428, 427, 426, 426, 425, 424, 423, 421, 422, 422, 424, 425, 426, 426];
  theStates.push(new State("WV", "WEST VIRGINIA", "West Virginia", ++i));
  g_StateMap["WV"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [603, 617, 617, 618, 619, 621, 622, 623, 624, 625, 625, 626, 627, 628, 630, 631, 633, 635, 636, 637, 637, 638, 638, 638, 638, 639, 639, 640, 639, 638, 636, 635, 633, 632, 631, 631, 631, 631, 630, 630, 629, 628, 626, 625, 624, 623, 622, 621, 620, 617, 616, 614, 614, 613, 612, 612, 611, 610, 608, 607, 607, 606, 607, 606, 605, 604, 603, 601, 600, 599, 599, 595, 594, 593, 592, 590, 587, 586, 585, 584, 584, 584, 583, 582, 580, 580, 579, 578, 578, 577, 576, 576, 577, 576, 580, 580, 582, 582, 581, 582, 583, 585, 585, 586, 587, 587, 587, 588, 590, 591, 592, 594, 595, 596, 598, 599, 599, 600, 600, 600, 601, 602, 602, 603];
  theStates[i].polys[0].ptY = [306, 306, 299, 300, 301, 301, 302, 303, 302, 303, 305, 304, 303, 303, 303, 304, 305, 306, 305, 304, 304, 305, 305, 304, 304, 303, 301, 300, 298, 298, 299, 300, 301, 302, 302, 302, 301, 299, 299, 298, 297, 296, 295, 294, 293, 293, 291, 290, 288, 288, 289, 290, 287, 287, 286, 285, 283, 282, 281, 280, 278, 277, 276, 275, 274, 274, 275, 274, 273, 274, 273, 272, 272, 272, 272, 272, 271, 272, 273, 274, 275, 276, 276, 277, 277, 279, 280, 280, 281, 282, 283, 286, 286, 287, 288, 290, 290, 292, 293, 295, 296, 296, 294, 295, 297, 297, 299, 300, 300, 301, 302, 301, 302, 304, 304, 305, 308, 309, 309, 311, 313, 318, 318, 319];
  theStates.push(new State("WI", "WISCONSIN", "Wisconsin", ++i));
  g_StateMap["WI"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [475, 474, 475];
  theStates[i].polys[0].ptY = [408, 409, 409];
  theStates[i].polys.push(new poly());
  theStates[i].polys[1].ptX = [473, 473, 473];
  theStates[i].polys[1].ptY = [407, 407, 408];
  theStates[i].polys.push(new poly());
  theStates[i].polys[2].ptX = [475, 476, 478, 478, 478, 483, 488, 493, 495, 502, 505, 504, 508, 509, 509, 509, 508, 508, 510, 510, 509, 511, 511, 509, 508, 507, 507, 506, 506, 507, 507, 509, 510, 511, 514, 514, 515, 516, 517, 519, 518, 518, 517, 517, 516, 515, 514, 513, 512, 511, 510, 510, 510, 510, 509, 508, 507, 507, 507, 508, 508, 509, 508, 472, 471, 468, 466, 466, 465, 466, 465, 464, 463, 464, 463, 462, 459, 458, 456, 455, 455, 454, 451, 450, 446, 445, 444, 444, 444, 445, 445, 445, 442, 443, 444, 444, 445, 447, 450, 450, 451, 459, 463, 466, 470, 470, 468, 469, 468, 469, 470, 472, 475];
  theStates[i].polys[2].ptY = [402, 401, 401, 400, 399, 398, 397, 396, 395, 394, 393, 392, 391, 390, 389, 388, 387, 385, 385, 383, 382, 382, 380, 380, 379, 378, 376, 374, 374, 373, 374, 375, 377, 378, 378, 380, 381, 382, 383, 384, 383, 382, 381, 379, 378, 376, 375, 372, 368, 367, 367, 365, 364, 361, 359, 357, 355, 354, 353, 352, 350, 347, 345, 345, 346, 347, 348, 350, 355, 356, 357, 361, 361, 363, 365, 366, 366, 367, 368, 369, 371, 371, 372, 373, 374, 375, 376, 377, 384, 386, 386, 388, 388, 389, 390, 392, 393, 393, 394, 403, 403, 404, 405, 406, 407, 405, 405, 404, 402, 403, 404, 403, 402];
  theStates[i].polys.push(new poly());
  theStates[i].polys[3].ptX = [471, 471, 473];
  theStates[i].polys[3].ptY = [406, 405, 406];
  theStates[i].polys.push(new poly());
  theStates[i].polys[4].ptX = [520, 521, 520, 520];
  theStates[i].polys[4].ptY = [386, 386, 385, 385];
  theStates.push(new State("WY", "WYOMING", "Wyoming", ++i));
  g_StateMap["WY"] = theStates[i];
  theStates[i].polys.push(new poly());
  theStates[i].polys[0].ptX = [297, 297, 206, 206, 232];
  theStates[i].polys[0].ptY = [380, 324, 324, 380, 380];
}


var onLoad = function () {
  initMap();
};