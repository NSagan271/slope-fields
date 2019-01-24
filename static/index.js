var w = 0;
var h = 0;
var canvas;
var ctx;
var colors = [[0, 0, 1], [1, 0, 1], [0.498, 1, 0], [1, 1, 1], [1, 1, 0], [0, 1, 1], [1, 0, 0], [0.647, 1, 0], [0.502, 0, 0.502], [0.502, 0.502, 0.502]];
var domain = [[-2, 2, 0.02], [-2, 2, 0.02]];//(start, end, step)
var currentEquation = null;
var currentArray = null;
var resizeOk = true;
var inspecting = false;
var toastTimeout = null

var colorSchemes = {"Default": {name: "Default", description: "The colors mean nothing", func: getColor},
    "Red Shift": {name: "Red Shift", description: "Steeper slopes are red-shifted", func: redShift},
    "Blue Shift": {name: "Blue Shift", description: "Steeper slopes are blue-shifted", func: blueShift},
    "Green Shift": {name: "Green Shift", description: "Steeper slopes are green-shifted", func: greenShift},
    "Highlight": {name: "Highlight", description: "Steeper slopes are brighter", func: highlightColor},
    "Dim": {name: "Dim", description: "Steeper slopes are darker", func: dimColor}
};

var colorIndex = "Default";

var axes = true;

$(window).on('load', function(){
  canvas = $("#slope-field")[0];
  ctx = canvas.getContext("2d");
  setSizing();
  setDomain();

  $('.circle-button').on('mouseenter', function(){
    $(this).find('.tooltiptext').css('visibility', 'visible');
  });
  $('.circle-button').on('mouseleave', function(){
    $(this).find('.tooltiptext').css('visibility', 'hidden');
  });
});

$(window).on('resize', function(){
  setSizing();
  if (resizeOk){
    setDomain(adjustDomain(domain));
    resizeOk = false;
    setTimeout(function(){resizeOk = true}, 100);
  }
});

function setSizing(){
  buttonSizing();
  w = $(window).width();
  h = $(window).height() - $("#header").height();
  canvas.height = h;
  canvas.width = w;
}

function buttonSizing(){
  $(".buttons br").remove();
  var divHeight = $(".buttons").height();
  var buttonHeight = $(".circle-button").height() + 5;
  var lines = Math.round((divHeight - 5)/buttonHeight);
  var buttons =  $('.buttons')[0].children;
  for (i = 1; i < lines; i++){
    $("<br>").insertAfter(buttons[Math.floor(i*buttons.length/lines) - 1]);
  }
}

function getEquation(target, eqn){
  $("#equation-text").html("loading equation...");
  resetCanvas();
  if (!target)
    target = "/slope_field"
  $.ajax({
    url: target,
    method: "POST",
    data: dataString(eqn)
  }).done(function(x){
    $("#equation-text").html("dy/dx = " + x.dydx);
    currentEquation = x.dydx;
    currentArray = x.slopes;
    makeSlopeField(x.slopes);
    $.ajax({
      url: "/eqn_in_db",
      method: "POST",
      data: "expr="+x.dydx.replace(/%/g, '%25').replace(/\+/g, '%2B')
    }).done(function(result){
      if (result === "True"){
        $("#add").css("display", "none");
        $("#remove").css("display", "inline-flex")
      }
      else{
        $("#remove").css("display", "none");
        $("#add").css("display", "inline-flex")
      }
    });
  }).fail(function(error){
    displayToast("Server Error 😢... Retrying");
    getEquation(target, eqn);
  });
}

function dataString(eqn){
  if(eqn){
    return ("x0=" + domain[0][0] + "&x1=" + domain[0][1] +
      "&y0=" + domain[1][0] + "&y1=" + domain[1][1] +
      "&x_step=" + domain[0][2] + "&y_step=" + domain[1][2]) +
      "&expr=" + eqn.replace(/%/g, '%25').replace(/\+/g, '%2B');
  }
  else{
    return ("x0=" + domain[0][0] + "&x1=" + domain[0][1] +
      "&y0=" + domain[1][0] + "&y1=" + domain[1][1] +
      "&x_step=" + domain[0][2] + "&y_step=" + domain[1][2]);
  }
}
function drawLine(dydx, x, y, length, color){
  if (dydx !== "NaN"){
    if (dydx === "inf"){
      dydx = Infinity;
    }
    var theta = -Math.atan(dydx);
    var x1 = x - length*Math.cos(theta);
    var x2 = x + length*Math.cos(theta);
    var y1 = y - length*Math.sin(theta);
    var y2 = y + length*Math.sin(theta);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }
}

function resetCanvas(){
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
  $('.inspect-tooltip').css('visibility', 'hidden');
}

function makeSlopeField(slopes){
  resetCanvas()
  for (var j = 0; j < slopes.length; j++){
    for (var i = 0; i < slopes[j].length; i++){
      x = (w/slopes[j].length)*i;
      y = h - (h/slopes.length)*j;
      drawLine(slopes[j][i], x, y, 12, colorSchemes[colorIndex].func(slopes[j][i]));
    }
  }
  if (axes){
      drawAxes();
  }
}

function adjustDomain(arr){
  wAdj = w/(arr[0][1] - arr[0][0]);
  hAdj = h/(arr[1][1] - arr[1][0]);
  avg = (wAdj + hAdj)/2
  return [[arr[0][0]*wAdj/avg, arr[0][1]*wAdj/avg], [arr[1][0]*hAdj/avg, arr[1][1]*hAdj/avg]];
}

function setDomain(arr){
  if(!arr){
    arr = adjustDomain([[-5, 5], [-5, 5]])
  }
  arr[0].push((arr[0][1] - arr[0][0])*5/w);
  arr[1].push((arr[1][1] - arr[1][0])*5/h);
  domain = arr;
  if (currentEquation)
    return getEquation(null, currentEquation);
  getEquation();
}

function domainInterface(){
  vex.dialog.open({
    message: "Input your new domain:",
    input: [
        '<input class="domain" name="x0" type="text" placeholder="X&#8320; [current = ' + domain[0][0].toFixed(2) + ']" required />',
        '<input class="domain" name="x1" type="text" placeholder="X&#8321; [current = ' + domain[0][1].toFixed(2) + ']" required />',
        '<input class="domain" name="y0" type="text" placeholder="Y&#8320; [current = ' + domain[1][0].toFixed(2) + ']" required />',
        '<input class="domain" name="y1" type="text" placeholder="Y&#8321; [current = ' + domain[1][1].toFixed(2) + ']" required />',
        '<input class="domain" name="scale" type="checkbox" checked=true/>Auto-scale domain to fit screen<br>',
    ].join(''),
    buttons: [
        $.extend({}, vex.dialog.buttons.YES, { text: 'Set' }),
        $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
    ],
    callback: function (data) {
      if (!data){
        return;
      }
      var newDomain = [[parseFloat(data.x0), parseFloat(data.x1)], [parseFloat(data.y0), parseFloat(data.y1)]]
      if (data.scale){
        newDomain = adjustDomain(newDomain)
      }
      setDomain(newDomain);
    }
  });
  $('<div class="vex-dialog-button cyan-button" onclick="vex.closeAll(); setDomain()">reset</div>').insertAfter('.vex-dialog-button-primary');
}


function equationInterface(){
    vex.dialog.open({
      message: "Input your equation:",
      input:[
        '<input name="eqn" type="text" placeholder="EQUATION" required />',
        '<span>You can use the operators [+, -, *, /, ^, %], numbers (including pi and e), and the functions [sin, cos, tan, asin, acos, atan, ln]'
      ].join(''),
      buttons: [
          $.extend({}, vex.dialog.buttons.YES, { text: 'Ok' }),
          $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
      ],
      callback: function (data) {
        if (data){
          getEquation(null, data.eqn);
        }
      }
    });
}

function addEquation(){
  $.ajax({
    url: "/save",
    method: "POST",
    data: "expr=" + currentEquation.replace(/%/g, '%25').replace(/\+/g, '%2B')
  }).done(function(x){
    if (x === "True"){
      $("#add").css("display", "none");
      $("#remove").css("display", "inline-flex")
      return displayToast("Success: added to database 😄");
    }
    else{
      return displayToast("Failed: equation already in database 🙃");
    }
  }).fail(function(error){
    displayToast("Failed: Server Error 😢");
  })
}

function displayToast(message){
  $('#toast-message').html(message);
  var elemW = $('#toast-message').width();
  $('#toast-message').css('left', (w - elemW)/2 + 'px');
  if (toastTimeout){
    clearTimeout(toastTimeout);
  }
  else{
    $('#toast-message').addClass('show');
    $('#toast-message').removeClass('hide');
  }
  toastTimeout = setTimeout(function(){
    $('#toast-message').removeClass('show');
    $("#toast-message").addClass('hide');
    toastTimeout = null;}, 3000);
}

function listEquations(){
  $.ajax({
    url: "/list",
    method: "GET",
    data: "expr=" + currentEquation.replace(/%/g, '%25').replace(/\+/g, '%2B')
  }).done(function(response){
    select = '<select name="eqn" class="eqn-select" size="8" required>';

    response.list.forEach(function(eqn){
      select += '<option value="' + eqn + '">' + eqn + '</option><i class="fas fa-times-circle"></i>';
    });
    select += '</select>';
    vex.dialog.open({
      message: "Sample Equations",
      input: select,
      buttons: [
          $.extend({}, vex.dialog.buttons.YES, { text: 'Apply' }),
          $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' }),

      ],
      callback: function (data) {
        if (data){
          getEquation(null, data.eqn);
        }
      }
    });
    $('<div class="vex-dialog-button remove-button" onclick="removeEquation()">remove</div>').insertAfter('.vex-dialog-button-primary');
  })
}

function removeEquation(toDelete){
  if (!toDelete){
    if (!$('.eqn-select').val()){
        return displayToast("No equation selected!");
    }
    toDelete = $('.eqn-select').val();
  }
  vex.closeAll();
  vex.dialog.open({
    message: "Are you sure you want to remove " + toDelete + " from the database? This CANNOT be undone!",
    input: '<input name="password" type="password" placeholder="PASSWORD" required />',
    buttons: [
        $.extend({}, vex.dialog.buttons.YES, { text: 'Delete' }),
        $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' }),
    ],
    callback: function (data) {
      if (data){
        $.ajax({
          url: "/remove",
          method: "POST",
          data: "expr=" + toDelete.replace(/%/g, '%25').replace(/\+/g, '%2B') + "&password="+btoa(data.password)
        }).done(function(response){
          if (response == "True"){
            $("#remove").css("display", "none");
            $("#add").css("display", "inline-flex")
            return displayToast("Remove Successful 😄");
          }
          return displayToast("Wrong password 🙃");
        }).fail(function(error){
          return displayToast("Failed: Server Error 😢");
        });
      }
    }
  });
  $('.vex-dialog-button-primary').addClass('remove-button');
}

function toggleInspect(elem){
  inspecting = !inspecting;
  if (inspecting){
    document.body.style.cursor = "crosshair";
    $(elem).find('.tooltiptext').html('Stop inspecting points');
    $('canvas').on('click', function(e){
      var x = e.pageX;
      var y = e.pageY - $("#header").height();
      x = x/w*(domain[0][1] - domain[0][0]) + domain[0][0];
      y = (h-y)/h*(domain[1][1] - domain[1][0]) + domain[1][0];
      $.ajax({
        url: "/inspect_point",
        method: "POST",
        data: "expr=" + currentEquation.replace(/%/g, '%25').replace(/\+/g, '%2B') + "&x=" + x + "&y=" + y
      }).done(function (response){
          dydx = parseFloat(response.dydx).toFixed(4);
          if (response.dydx == "NaN"){
            dydx = 'undefined😢';
          }
          else if (response.dydx == "inf"){
            dydx = "<span style='font-size: 20px; line-height: 15px'>∞</span>";
          }
          $('.inspect-tooltip').html("(" + x.toFixed(4) + ", " +
            y.toFixed(4) + "):<br> dy/dx = " + dydx);
          $('.inspect-tooltip').removeClass('left-tooltip');
          $('.inspect-tooltip').removeClass('right-tooltip');
          $('.inspect-tooltip').removeClass('bottom-tooltip');
          if (e.pageX < 80){
            $('.inspect-tooltip').addClass('left-tooltip');
            $('.inspect-tooltip').css({'visibility': 'visible', 'top': (e.pageY - $('.inspect-tooltip').height()/2 - 5), 'left': e.pageX + 5});
          }
          else if (e.pageX > (w - 80)){
            $('.inspect-tooltip').addClass('right-tooltip');
            $('.inspect-tooltip').css({'visibility': 'visible', 'top': (e.pageY - $('.inspect-tooltip').height()/2 - 5), 'left': (e.pageX - 175)});
          }
          else if (e.pageY < 50 + $('#header').height()){
            $('.inspect-tooltip').addClass('bottom-tooltip');
            $('.inspect-tooltip').css({'visibility': 'visible', 'top': (e.pageY + 5), 'left': e.pageX-5});
          }
          else{
            (e.pageY - $('.inspect-tooltip').height() - 15);
            $('.inspect-tooltip').css({'visibility': 'visible', 'top': (e.pageY - $('.inspect-tooltip').height() - 15), 'left': e.pageX-5});
          }
      });
    });
  }
  else{
    document.body.style.cursor = 'default';
    $(elem).find('.tooltiptext').html('Start inspecting points');
    $('canvas').off('click');
    $('.inspect-tooltip').css('visibility', 'hidden');
  }
}
function zoomOut(){
  setDomain([[domain[0][0]*2, domain[0][1]*2], [domain[1][0]*2, domain[1][1]*2]])
}
function zoomIn(){
  setDomain([[domain[0][0]/2, domain[0][1]/2], [domain[1][0]/2, domain[1][1]/2]])
}

function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

function download(){
    img = URL.createObjectURL(dataURLtoBlob(canvas.toDataURL()));
    $("#download").attr({"href": img, "download": currentEquation + ".png"});
    $("#download")[0].click();
}

//Getting colors
function getColor(_, arr){
    var result = "#";
    if (!arr){
        arr = colors[Math.floor(Math.random()*colors.length)];
    }
    arr.forEach(function(n){
        var hex = (parseInt(n*255)).toString(16);
        if (hex.length == 1){
            hex = "0" + hex;
        }
        result += hex;
    });
    return result;
}

function changeColorScheme(){
    var inputColors = [];
    $.each(colorSchemes, function(){
        var button = '<input type="radio" name="color" value="'+ this.name + '" required';
        button +=  ((colorIndex === this.name)?' checked':'');
        button += '><b>' + this.name + '</b>: <em>' + this.description + '</em>';
        inputColors.push(button);
    });
    vex.dialog.open({
    message: "Color Schemes",
    input: inputColors.join(' <br> '),
    buttons: [
        $.extend({}, vex.dialog.buttons.YES, { text: 'Apply' }),
        $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' }),
    ],
    callback: function (data) {
      if (data){
        colorIndex = data.color;
        if (currentArray){
            makeSlopeField(currentArray);
        }
      }
    }
  });
}

function toneShift(slope, index){
    var mult = 1.5/(1 + Math.pow(Math.E, -Math.abs(slope)));
    var arr = colors[Math.floor(Math.random()*colors.length)].slice();
    arr[index] = Math.min(1, mult*arr[index])
    arr[(index + 1) % 3] = Math.min(1, 1.0*arr[(index + 1) % 3]/mult);
    arr[(index + 2) % 3] = Math.min(1, 1.0*arr[(index + 2) % 3]/mult);
    return getColor(slope, arr);
}

function redShift(slope){
    return toneShift(slope, 0);
}
function blueShift(slope){
    return toneShift(slope, 2);
}
function greenShift(slope){
    return toneShift(slope, 1);
}

function highlightColor(slope, index){
    var mult = 1.5/(1 + Math.pow(Math.E, -Math.abs(slope)));
    var arr = colors[Math.floor(Math.random()*colors.length)].slice();
    for(i = 0; i < arr.length; i++){
        arr[i] = Math.min(1, mult*arr[i]);
    }
    return getColor(slope, arr);
}

function dimColor(slope, index){
    var mult = 1.5/(1 + Math.pow(Math.E, -Math.abs(slope)));
    var arr = colors[Math.floor(Math.random()*colors.length)].slice();
    for(i = 0; i < arr.length; i++){
        arr[i] = Math.min(1, 1.0*arr[i]/mult);
    }
    return getColor(slope, arr);
}

//axes
function drawAxes(){
    yAxis = (-domain[0][0])*w/(domain[0][1] - domain[0][0]);
    xAxis = (-domain[1][0])*h/(domain[1][1] - domain[1][0]);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(0, xAxis);
    ctx.lineTo(w, xAxis);

    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, h);
    ctx.stroke();

    labelAxes();
}

function labelAxes(){
    ctx.font = '18px Arial';

    ctx.textAlign="start";
    fillText(0, h/2 - 12, ctx.measureText(domain[0][0].toFixed(2)).width + 3,
        24, domain[0][0].toFixed(2), 0, h/2 + 6);
    ctx.textAlign="end";
    fillText(w - ctx.measureText(domain[0][1].toFixed(2)).width - 3, h/2 - 12,
        ctx.measureText(domain[0][1].toFixed(2)).width + 3, 24,
        domain[0][1].toFixed(2), w, h/2 + 6);
    ctx.textAlign="center";
    fillText(w/2 - ctx.measureText(domain[1][1].toFixed(2)).width/2 - 3,
        0, ctx.measureText(domain[1][1].toFixed(2)).width + 6, 24,
        domain[1][1].toFixed(2), w/2, 18);
    fillText(w/2 - ctx.measureText(domain[1][0].toFixed(2)).width/2 - 3,
        h - 24, ctx.measureText(domain[1][0].toFixed(2)).width + 6,
        24, domain[1][0].toFixed(2), w/2, h - 3);
}

function fillText(x1, y1, width, height, text, textX, textY){
    ctx.lineWidth = 1;
    ctx.fillStyle = "#333";
    ctx.fillRect(x1, y1, width, height);

    ctx.fillStyle = "#fff";
    ctx.strokeRect(x1, y1, width, height)
    ctx.fillText(text, textX, textY);
}

function toggleAxes(){
    axes = !axes;
    if (currentArray){
        makeSlopeField(currentArray);
    }
    else{
        resetCanvas();
        if (axes){
            drawAxes();
        }
    }
}