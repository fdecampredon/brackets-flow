
/*@flow*/
declare var brackets: any;
declare var define: any;



//---------------------------------------
//
// Imports
//
//---------------------------------------

//imports
var FileSystem = brackets.getModule('filesystem/FileSystem');
var CodeInspection = brackets.getModule('language/CodeInspection');
var ProjectManager = brackets.getModule('project/ProjectManager');
var CodeHintManager = brackets.getModule('editor/CodeHintManager');

var FlowErrorProvider = require('./errorProvider');
var FlowCompletionProvider = require('./completionProvider');
var flow = require('./flow');


//---------------------------------------
//
// Constants
//
//---------------------------------------

var projectRoot: string = '';
var configFileName = '.flowconfig';

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




//---------------------------------------
//
// Init
//
//---------------------------------------


var fileSystemSubsription: ?{ dispose:() => void };
function init(connection: any) {
  flow.setNodeConnection(connection);
  updateProject();
  CodeInspection.register('javascript', FlowErrorProvider); 
  CodeHintManager.registerHintProvider(FlowCompletionProvider, ['javascript'], 1);
  $(ProjectManager).on('projectOpen', updateProject);
}

function updateProject() {
  if (fileSystemSubsription) {
    fileSystemSubsription.dispose();
  }
  projectRoot = ProjectManager.getProjectRoot().fullPath;
  fileSystemSubsription = checkForFile(configFileName, (hasFile) => hasFile && flow.start(projectRoot));
  
}



module.exports = init;