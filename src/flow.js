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


var Promise = require('bluebird').Promise;

//---------------------------------------
//
// States
//
//---------------------------------------

var running: ?Promise;
var projectRoot = '';
var nodeConnection: any;

//---------------------------------------
//
// Private
//
//---------------------------------------


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

/**
 * execute a command at a pos for a given file and his content
 */
function getCommandAtPos(command: string, fileName: string, content: string, line: number, column: number): Promise<any> {
  return executeCommand("echo '"+ content.replace(/'/g, "'\\''" ) + 
    "' | flow " + command + " " + fileName + " " + line + " " + column + " --json --from brackets-flow");
}

//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * start the extension
 */
function start(root: string): Promise<any> {
  if (projectRoot !== root) {
    projectRoot = root;
    running = Promise.resolve(nodeConnection.domains.flow.setProjectRoot(root));
  }
  return Promise.resolve(running);
}

/**
 * set the node connection used by this module
 */
function setNodeConnection(conn: any): void {
  nodeConnection = conn;
}
 
/**
 * a type representing a CompletionEntry
 */
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

/**
 * retrieves completion entry for a given file and position
 */
function autocomplete(fileName: string, content: string, line: number, column: number): Promise<CompletionEntry[]> {
  return getCommandAtPos('autocomplete', fileName, content, line, column);
}

/**
 * at type representing errors reported by flow
 */
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

/**
 * perform a full check on the application
 */
function status(): Promise<FlowError[]> {
  return executeCommand('flow status --json --from brackets-flow   --show-all-errors')
    .then(function (message: { errors: Error[]; })  {
      return message.errors; 
    });
}

/**
 * a type represention definition info and location
 */
type DefLocation = {
  path: string;
  line: number;
  endline: number;
  start: number;
  end: number;
}

/**
 * retrieves definition info and location for a given file and position
 */
function getDef(fileName: string, content: string, line: number, column: number): Promise<DefLocation> {
  return getCommandAtPos('get-def', fileName, content, line, column);
}

/**
 * a type representing a type info
 */
type TypeInfo = {
  type: string;
  reasons: any[];
  path: string;
  line: number;
  endline: number;
  start: number;
  end: number;
}

/**
 * retrieves type info and location for a given file and position
 */
function typeAtPos(fileName: string, content: string, line: number, column: number): Promise<DefLocation> {
  return getCommandAtPos('type-at-pos', fileName, content, line, column);
}

module.exports = {
  start, 
  setNodeConnection, 
  status,
  autocomplete,
  getDef,
  typeAtPos
};
