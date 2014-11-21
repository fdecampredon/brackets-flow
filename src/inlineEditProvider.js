/*@flow*/

var { getDef } = require('./flow');
var { isFlowFile } = require('./jsUtils');
declare var brackets;


var DocumentManager = brackets.getModule('document/DocumentManager');
var MultiRangeInlineEditor = brackets.getModule('editor/MultiRangeInlineEditor').MultiRangeInlineEditor;

function inlineEditProvider(hostEditor: any, pos: {line: number; ch: number}) {
  
  
  if (hostEditor.getModeForSelection() !== 'javascript') {
    return null;
  }

  var sel = hostEditor.getSelection(false);
  if (sel.start.line !== sel.end.line) {
    return null;
  }
  
  var fileName = hostEditor.document.file.fullPath;
  var content = hostEditor.document.getText();
  if (!isFlowFile(content)) {
    return;
  }
  
  var deferred = $.Deferred();
 
  getDef(fileName, content, pos.line + 1, pos.ch + 1)
    .then(definition => {
      if (!definition.path) {
        deferred.reject();
      }
    
      return DocumentManager.getDocumentForPath(definition.path).then(doc => {
        var inlineEditor = new MultiRangeInlineEditor([{
            document : doc,
            name: '',
            lineStart: definition.line - 1,  
            lineEnd: definition.endline - 1,
            fileName: definition.path
        }]);
        
        inlineEditor.load(hostEditor);
        deferred.resolve(inlineEditor);
      });
    
    }).catch(e => {
        deferred.reject(e);
    });
      
  return deferred;
}

module.exports = inlineEditProvider;