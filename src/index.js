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
// settings
//
//---------------------------------------

var bluebird: any = require('bluebird');

if (process.env.NODE_ENV !== 'production') {
  bluebird.longStackTraces();
}

if (process.env.NODE_ENV === 'production') {
  bluebird.onPossiblyUnhandledRejection(e => e);
}

//---------------------------------------
//
// Imports
//
//---------------------------------------

var FileSystem                = brackets.getModule('filesystem/FileSystem');
var CodeInspection            = brackets.getModule('language/CodeInspection');
var ProjectManager            = brackets.getModule('project/ProjectManager');
var CodeHintManager           = brackets.getModule('editor/CodeHintManager');
var EditorManager             = brackets.getModule('editor/EditorManager');

var ErrorProvider             = require('./errorProvider');
var HintProvider              = require('./hintProvider');
var inlineEditProvider        = require('./inlineEditProvider');
var jumpToDefinitionProvider  = require('./jumpToDefinitionProvider');
var TypePopup                 = require('./typePopUp');
var flow                      = require('./flow');

declare var brackets: any;


//---------------------------------------
//
// Constants
//
//---------------------------------------

var projectRoot: string = '';
var configFileName = '.flowconfig';

//---------------------------------------
//
// Private
//
//---------------------------------------

function checkForFile(file, handler) {
  function run() {
    var file = FileSystem.getFileForPath(projectRoot + '/' + configFileName);
    file.exists(function (err, exists) {
      if(exists) {
        handler(true);
      } else {
        handler(false);
      }
    });
  }
  run();
  FileSystem.on('change', run);
  FileSystem.on('rename', run);

  return {
    dispose: function () {
      FileSystem.off('change', run);
      FileSystem.off('rename', run);
    }
  };
}

function updateProject() {
  if (fileSystemSubsription) {
    fileSystemSubsription.dispose();
  }
  projectRoot = ProjectManager.getProjectRoot().fullPath;
  fileSystemSubsription = checkForFile(configFileName, (hasFile) => hasFile && flow.start(projectRoot));
}


//---------------------------------------
//
// State
//
//---------------------------------------

var fileSystemSubsription: ?{ dispose:() => void };
//---------------------------------------
//
// Public
//
//---------------------------------------

function init(connection: any) {
  flow.setNodeConnection(connection);
  updateProject();
  
  CodeInspection.register('javascript', ErrorProvider); 
  CodeHintManager.registerHintProvider(HintProvider, ['javascript'], 1);
  EditorManager.registerInlineEditProvider(inlineEditProvider, 1);
  EditorManager.registerJumpToDefProvider(jumpToDefinitionProvider, 1);
  TypePopup.init();
  
  $(ProjectManager).on('projectOpen', updateProject);
}





module.exports = init;