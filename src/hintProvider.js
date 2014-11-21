/*@flow*/

declare var Mustache: any;
declare var brackets: any;


var { autocomplete }  = require('./flow');
var { getQuery, isFlowFile }      = require('./jsUtils');
var StringMatch       = brackets.getModule("utils/StringMatch");


var editor : any;
var matcher :any = new StringMatch.StringMatcher({ preferPrefixMatches: true });

function hasHints(_editor: any, implicitChar: string): boolean {
  if (
    (!implicitChar || /[\w.\($_]/.test(implicitChar)) &&
    isFlowFile(editor.document.getText())
  ) {
    
    editor = _editor;
    return true;  
  }
  
  return false;
}


function getHints(implicitChar: string): any {
  var fileName: string = editor.document.file.fullPath;
  var position: {line: number; ch: number} = editor.getCursorPos();
  var content: string = editor.document.getText();
  var query = getQuery(editor);
  
  
  var deferred = $.Deferred();
  
  if (!hasHints(editor, implicitChar)) {
    deferred.resolve({
        hints: [],
        selectInitial: false 
      });
  } else {
    autocomplete(fileName, content, position.line + 1, position.ch + 1).then(entries => {
      var hints = entries
        .map(entry => ({
          entry: entry,
          searchResult: matcher.match(entry.name, query)
        }))
        .filter(entry => !!entry.searchResult)
        .sort((entryA, entryB) => (entryA.searchResult.matchGoodness - entryB.searchResult.matchGoodness))
        .map(function ({entry, searchResult}) {
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
        });
      
      
      deferred.resolve({
        hints: hints,
        match: null,
        selectInitial: true
      });
    });
  }
  return deferred;
}



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