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

var { status } = require('./flow');
var { isFlowFile } = require('./jsUtils');

//---------------------------------------
//
// Public
//
//---------------------------------------

/**
 * retieve errors for a given file
 */
function scanFileAsync(content: string, path: string): any {
  return $.Deferred(deferred => {
    if (!isFlowFile(content)) {
      deferred.resolve({errors: [], aborted: false});
      return;
    }
    status().then(errors => {
      var bracketsErrors = errors
        .filter(error => error.message[0].path === path)
        .map(error => ({
          pos: {
            line: error.message[0].line -1,
            ch: error.message[0].start -1
          },
          endPos: {
            line: error.message[0].line -1,
            ch: error.message[0].start -1
          },
          message: error.message.reduce(
            (descr, message) => (descr + ' ' + message.descr), '')
        }));

      return {
        aborted: false,
        errors: bracketsErrors
      };
    })
    .then(res => deferred.resolve(res))
    .catch(err => deferred.reject(err));
  }).promise();
}

module.exports = { 
  name: 'Flow', 
  scanFileAsync 
};