/*@flow*/

//---------------------------------------
//
// Import
//
//---------------------------------------

var EditorManager     = brackets.getModule('editor/EditorManager');
var Commands          = brackets.getModule('command/Commands');
var CommandManager    = brackets.getModule('command/CommandManager');

var Promise           = require('bluebird').Promise;
var { getDef }        = require('./flow');
var { isFlowFile }    = require('./jsUtils');

declare var brackets: any;
    
//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * jum to def provider
 */
function jumpToDefinitionProvider(editor: any, pos: {line: number; ch: number}) {

  if (!editor || editor.getModeForSelection() !== 'javascript') {
      return null;
  }

  var fileName = editor.document.file.fullPath;
  var content = editor.document.getText();
  if (!isFlowFile(content)) {
    return;
  }
  
  return $.Deferred(deferred => {
    getDef(fileName, content, pos.line + 1, pos.ch + 1)
      .then(definition => {
        if (!definition.path || editor !== EditorManager.getFocusedEditor() || 
            editor.getCursorPos().line !== pos.line) {
          throw 'obsolete request';
        }

        return Promise.resolve(definition.path === fileName? 
          true: 
          CommandManager.execute(Commands.FILE_OPEN, {fullPath: definition.path})
        ).then(() =>{
          var editor = EditorManager.getFocusedEditor();
          editor.setCursorPos(definition.line -1, definition.start -1, true, true);
          return true;
        });
      })
      .then(res => deferred.resolve(res))
      .catch(e => deferred.reject(e));
  }).promise();
}

module.exports = jumpToDefinitionProvider;