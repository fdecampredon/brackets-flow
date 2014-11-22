/* @flow*/

/*
 * Copyright 2014 François de Campredon
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



//---------------------------------------
//
// Imports
//
//---------------------------------------

var { typeAtPos }   = require('./flow');
var MainViewManager = brackets.getModule('view/MainViewManager');
var DocumentManager = brackets.getModule('document/DocumentManager');


declare var brackets: any;
declare var requestAnimationFrame: (func: () => void) => void;


//---------------------------------------
//
// Constant
//
//---------------------------------------

var ERROR_TOOLTIP_HTML = '<div id="error-tooltip-container"> <div class="error-tooltip-content"> </div> </div>';
var TOOLTIP_BOUNDS_OFFSET = 8;    // offset between tooltip and position of the cursor / or bounds of the editor
var UNKNOW_TYPE= '(unknown)';

/**

 * error tooltip container
 * 
 * @type {JQuery}
 */
var $errorToolTipContainer: any;

/**

 * errot tooltip content holder
 * 
 * @type {JQuery}
 */
var $errorToolTipContent: any;


//---------------------------------------
//
// State
//
//---------------------------------------


type MouseEvent= { which: boolean; clientX: number; clientY: number};

/**
 * last position handled 
 */
var lastPos: ?{line: number; ch: number};

/**
 * last position handled 
 */
var timeout: ?number;

/**
 * last event handled
 */
var lastEvent: ?MouseEvent;


/**
 * last request promise
 */
var lastRequest: any;


//---------------------------------------
//
// Utils
//
//---------------------------------------

/**
 * check if a jquery object contains a given position
 * 
 * @param {Jquery} div
 * @param {{clientX: number,  clientY: number}} event
 * @param {number} [precisionX = 0]
 * @param {number} [precisionY = 0]
 */
function divContainsMouse($div: any, event: MouseEvent, precisionX: number, precisionY: number): boolean {
  var offset = $div.offset();

  if (typeof precisionX !== 'number') {
    precisionX = 0;
  }
  if (typeof precisionY !== 'number') {
    precisionY = 0;
  }

  return (event.clientX >= offset.left - precisionX &&
    event.clientX <= offset.left + $div.width() + precisionX &&
    event.clientY >= offset.top - precisionY &&
    event.clientY <= offset.top + $div.height() + precisionY);
}

/**
 * retrieve the full editors currently displayed
 * 
 * @return {Array.<Editor>}
 */
function getFullEditors(): any[] {
  return MainViewManager.getPaneIdList().map(function (id) {
    var currentPath = MainViewManager.getCurrentlyViewedPath(id),
      doc = currentPath && DocumentManager.getOpenDocumentForPath(currentPath);

    return doc && doc._masterEditor;
  }).filter(function (editor) {
      return !!editor;
    });
}



//---------------------------------------
//
// ToolTipManagement
//
//---------------------------------------

/**
 * hide the error tooltip
 */
function hideErrorToolTip() {
  $errorToolTipContainer.hide();
  $errorToolTipContent.html('');
}


/**
 * position the tooltip below the current position, centered
 * but always in the bound of the editor
 */
function positionToolTip(xpos: number, ypos: number, ybot: number) {
  $errorToolTipContainer.offset({
    left: 0,
    top: 0
  });
  $errorToolTipContainer.css('visibility', 'hidden');

  requestAnimationFrame(function () {
    var toolTipWidth = $errorToolTipContainer.width(),
      toolTipHeight = $errorToolTipContainer.height(),
      top = ybot + TOOLTIP_BOUNDS_OFFSET,
      left = xpos - (toolTipWidth / 2),

      $editorHolder = $('#editor-holder'),
      editorOffset = $editorHolder.offset();


    left = Math.max(left, editorOffset.left + TOOLTIP_BOUNDS_OFFSET);
    left = Math.min(left, editorOffset.left + $editorHolder.width() - toolTipWidth - TOOLTIP_BOUNDS_OFFSET - 10);

    if (top < (editorOffset.top + $editorHolder.height() - toolTipHeight - TOOLTIP_BOUNDS_OFFSET)) {
      $errorToolTipContainer.removeClass('preview-bubble-above');
      $errorToolTipContainer.addClass('preview-bubble-below');
      $errorToolTipContainer.offset({
        left: left,
        top: top
      });
    } else {
      $errorToolTipContainer.removeClass('preview-bubble-below');
      $errorToolTipContainer.addClass('preview-bubble-above');
      top = ypos - TOOLTIP_BOUNDS_OFFSET - toolTipHeight;
      $errorToolTipContainer.offset({
        left: left,
        top: top
      });
    }

    $errorToolTipContainer.css('visibility', 'visible');
  });
}

/**
 * show the tooltip
 */
function showTooltip(event: MouseEvent) {
  var editor;

  getFullEditors().forEach(function (_editor) {
    var $el = $(_editor.getRootElement());
    if (!editor && divContainsMouse($el, event, 10, 10)) {
      editor = _editor;
    } else if (divContainsMouse($el, event, 0, 0)) {
      editor = _editor;
    }
  });

  if (!editor) {
    hideErrorToolTip();
    return;
  }
  // Find char mouse is over
  var cm = editor._codeMirror;
  var pos = cm.coordsChar({ left: event.clientX, top: event.clientY });
  
  if (pos.ch >= editor.document.getLine(pos.line).length) {
    hideErrorToolTip();
    return;
  }

  var coord;
  // No preview if mouse is past last char on line
  // Bail if mouse is on same char as last event
  if (lastPos && lastPos.line === pos.line && lastPos.ch === pos.ch) {
    return;
  }
  lastPos = pos;

  var fileName = editor.document.file.fullPath;
  var content = editor.document.getText();
  
  var promise = typeAtPos(fileName, content, pos.line + 1, pos.ch + 1)
    .then(typeInfo => {
      if (lastRequest !== promise) {
        return;
      }
    
      if (!typeInfo || typeInfo.type === UNKNOW_TYPE) {
        hideErrorToolTip();
        return;
      }
    
      var type = typeInfo.type;
      if (type.length > 200) {
        type = type.slice(0, 200) + ' ...';
      }

      $errorToolTipContent.text(type);
      $errorToolTipContainer.show();

      coord = cm.charCoords(pos);
      positionToolTip(coord.left, coord.top, coord.bottom);
    });
  
  lastRequest = promise;
}



//---------------------------------------
//
// Event Handle management
//
//---------------------------------------

/**
 * clear the timeout
 */
function cancelTimeout() {
  clearTimeout(timeout);
  timeout = null;
}

/**

 * handle mouse move event
 * 
 * @param {Event} event
 */
function handleMouseMove(event: MouseEvent) {
  if (event.which) {
    // Button is down - don't show popovers while dragging
    hideErrorToolTip();
    cancelTimeout();
    return;
  }
  
  if (timeout && lastEvent) {
    if (
      Math.abs(lastEvent.clientX - event.clientX) > 5 ||
      Math.abs(lastEvent.clientY - event.clientY) > 5 
    ) {
      hideErrorToolTip();
      cancelTimeout();
    } else {
      return;
    }
  }
  
  lastEvent = event;
  timeout = setTimeout(() => {
    showTooltip(event);
    cancelTimeout();
  }, 500);
  
}


/**
 * handle mouse out event
 * 
 * @param {Event} event
 */
function handleMouseOut(event) {
  var $editorHolder = $('#editor-holder');
  if (!divContainsMouse($editorHolder, event, 10, 10)) {
    hideErrorToolTip();
    cancelTimeout();
  }
}


//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * initialize the tooltip
 * 
 * @param {Array.<editor>} _editors the list of editors managed by the plugin 
 */
function init() {
  var editorHolder = $('#editor-holder')[0];
  // Note: listening to 'scroll' also catches text edits, which bubble a scroll event up from the hidden text area. This means
  // we auto-hide on text edit, which is probably actually a good thing.
  editorHolder.addEventListener('mousemove', handleMouseMove, true);
  editorHolder.addEventListener('scroll', hideErrorToolTip, true);
  editorHolder.addEventListener('mouseout', handleMouseOut, true);


  $errorToolTipContainer = $(ERROR_TOOLTIP_HTML).appendTo($('body'));
  $errorToolTipContent = $errorToolTipContainer.find('.error-tooltip-content');
}

module.exports = { init };
