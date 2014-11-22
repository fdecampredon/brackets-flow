/* @flow */

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
// Import
//
//---------------------------------------

var { autocomplete }          = require('./flow');
var { getQuery, isFlowFile }  = require('./jsUtils');
var StringMatch               = brackets.getModule("utils/StringMatch");

declare var brackets: any;


//---------------------------------------
//
// States
//
//---------------------------------------


var editor : any;
var matcher :any = new StringMatch.StringMatcher({ preferPrefixMatches: true });


function formatHints({entry, searchResult}) {
  var jqueryObj = $('<span>');
  var ranges: Array<{text:string; matched:boolean; includesLastSegment:boolean;}> = searchResult.stringRanges;

  var content = ranges.map(range => {
    var result = $('<span>');
    result.text(range.text);
    if (range.matched) {
      result.css({ 'font-weight': 'bold'});
    }
    return result;
  });

  if (entry.type) {
    var typeSpan = $('<span>');
    typeSpan.text(entry.type).text(' - ' + entry.type);
    content.push(typeSpan);
  }

  jqueryObj.append(content);
  jqueryObj.data('entry', entry);

  return jqueryObj;
}

//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * check if flow can provide hints for the current position
 */
function hasHints(_editor: any, implicitChar: string): boolean {
  if (
    (!implicitChar || /[\w.\($_]/.test(implicitChar)) &&
    isFlowFile(_editor.document.getText())
  ) {
    
    editor = _editor;
    return true;  
  }
  
  return false;
}

/**
 * retrieve hints for the current position
 */
function getHints(implicitChar: string): any {
  var fileName: string = editor.document.file.fullPath;
  var position: {line: number; ch: number} = editor.getCursorPos();
  var content: string = editor.document.getText();
  var query = getQuery(editor);
  
  if (!hasHints(editor, implicitChar)) {
    return true;
  }
  
  return $.Deferred(deferred => {
    autocomplete(fileName, content, position.line + 1, position.ch + 1)
      .then(entries => 
        entries
          .map(entry => ({ entry, searchResult: matcher.match(entry.name, query)}))
          .filter(entry => !!entry.searchResult)
          .sort((entryA, entryB) => (entryA.searchResult.matchGoodness - entryB.searchResult.matchGoodness))
          .map(formatHints)
       )
       .then(hints => deferred.resolve({ hints: hints, match: null,  selectInitial: true }))
       .catch(e => deferred.reject(e));
        
  });
}


/**
 * insert a given hint
 */
function insertHint($hintObj: any): void {
  var entry  = $hintObj.data('entry');
  var query = getQuery(editor);
  var position = editor.getCursorPos();
  var startPos = !query ? 
        position : 
        {
            line : position.line,
            ch : position.ch - query.length
        }
    ;
  editor.document.replaceRange(entry.name, startPos, position);
}

module.exports =  {
  hasHints,
  getHints,
  insertHint
};
