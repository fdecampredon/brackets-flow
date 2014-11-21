/* @flow */

var Promise = require('bluebird').Promise;

var running: ?Promise;
var projectRoot = '';
var nodeConnection: any;


/**
 * execute a bash command
 */
function executeCommand<T>(command: string): Promise<any> {
  if (running) {
    return running.then(() => Promise.resolve(nodeConnection.domains.flow.executeCommand(command)));
  } else {
    return Promise.reject(Error('not initialized'));
  }
}


function start(root: string): Promise<any> {
  if (projectRoot !== root) {
    projectRoot = root;
    running = Promise.resolve(nodeConnection.domains.flow.setProjectRoot(root));
  }
  return Promise.resolve(running);
}

function setNodeConnection(conn: any): void {
  nodeConnection = conn;
}
 


type CompletionEntry = {
  name: string;
  type: string;
  func_details: ?{
    return_type: string;
    params: { name: string; type: string }[]
  };
  path: string;
  line: number;
  endline: number;
  start: number;
  end: number;
}

function autocomplete(fileName: string, content: string, line: number, column: number): Promise<CompletionEntry[]> {
  return executeCommand("echo '"+ content.replace(/'/g, "'\\''" ) + 
    "' | flow autocomplete " + fileName + " " + line + " " + column + " --json --from brackets-flow");
}

type FlowError = {
  message: {
      descr: string;
      code: number;
      path: string;
      line: number;
      endline: number;
      start: number;
      end: number;
    } [];
}

function flowStatus(): Promise<FlowError[]> {
  return  executeCommand('flow status --json --from brackets-flow')
    .then(function (message: { errors: Error[]; })  {
      return message.errors; 
    });
    
}

module.exports = {
  start, 
  setNodeConnection, 
  flowStatus,
  autocomplete
};
