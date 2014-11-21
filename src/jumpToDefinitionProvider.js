/*@flow*/


var EditorManager = brackets.getModule('editor/EditorManager'),
    Commands = brackets.getModule('command/Commands'),
    CommandManager = brackets.getModule('command/CommandManager');


var Promise = require('bluebird').Promise;

var { getDef } = require('./flow');
var { isFlowFile } = require('./jsUtils');

declare var brackets;


    
function jumpToDefinitionProvider() {
  var editor = EditorManager.getFocusedEditor();

  if (!editor || editor.getModeForSelection() !== 'javascript') {
      return null;
  }
  

  var sel = editor.getSelection(false);
  if (sel.start.line !== sel.end.line) {
    return null;
  }
  
  var fileName = editor.document.file.fullPath;
  var content = editor.document.getText();
  if (!isFlowFile(content)) {
    return;
  }
  
  var deferred = $.Deferred();
 
  var pos = editor.getCursorPos();

  getDef(fileName, content, pos.line + 1, pos.ch + 1)
    .then(definition => {
      if (!definition.path) {
        deferred.reject();
      }
      if (editor === EditorManager.getFocusedEditor()) {
          if (editor.getCursorPos().line === pos.line) {
            Promise.resolve(definition.path === fileName? 
              true: 
              CommandManager.execute(Commands.FILE_OPEN, {fullPath: definition.path})
            ).then(() =>{
              var editor = EditorManager.getFocusedEditor();
              editor.setCursorPos(definition.line -1, definition.start -1, true, true);
              deferred.resolve(true);
            }).catch(e => deferred.reject(e));
          }
      }
      deferred.reject();
  }, () => deferred.reject()); 
  
  return deferred.promise();
}

module.exports = jumpToDefinitionProvider;