/* @flow */

var Promise = require('bluebird').Promise;

var running: ?Promise;
var projectRoot = '';
var nodeConnection: any;


/**
 * execute a bash command
 */
function executeCommand(command: string): Promise {
  if (running) {
    return running.then(() => Promise.resolve(nodeConnection.domains.flow.executeCommand(command)));
  } else {
    return Promise.reject(Error('not initialized'));
  }
}


interface Error {
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

/**
 * execute a bash command
 */
function flowStatus(): Promise<Error[]> {
  return executeCommand('flow status --json --from brackets-flow')
    .then(function (message: { errors: Error[]; })  {
      return message.errors; 
    });
}

function setProjectRoot(root): Promise {
  if (projectRoot !== root) {
    projectRoot = root;
    running = Promise.resolve(nodeConnection.domains.flow.setProjectRoot(root));
  }
  return running;
}

function setNodeConnection(conn: any): void {
  nodeConnection = conn;
}

function start(root: string): Promise {
  return setProjectRoot(root);
}

module.exports = {
  start, 
  setNodeConnection, 
  flowStatus
};
