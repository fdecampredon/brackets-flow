/*@flow*/

//---------------------------------------
//
// Import
//
//---------------------------------------

var { getDef }              = require('./flow');
var { isFlowFile }          = require('./jsUtils');

var DocumentManager         = brackets.getModule('document/DocumentManager');
var MultiRangeInlineEditor  = brackets.getModule('editor/MultiRangeInlineEditor').MultiRangeInlineEditor;

declare var brackets: any;

//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * a function that provide inline editor
 */
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
  
  return $.Deferred(deferred => {
    getDef(fileName, content, pos.line + 1, pos.ch + 1)
      .then(definition => {

        if (!definition.path) {
          throw 'could not find a def for the given path and file';
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
          return inlineEditor;
        });

      })
      .then(inlineEditor => deferred.resolve(inlineEditor))
      .catch(err => deferred.reject(err));
  }).promise();
}

module.exports = inlineEditProvider;