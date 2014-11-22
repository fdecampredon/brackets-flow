/*@flow*/
//---------------------------------------
//
// Import
//
//---------------------------------------

var { status } = require('./flow');

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
          message: error.message[0].descr
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