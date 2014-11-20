/*jshint node: true*/

"use strict";

var exec = require('child_process').exec;

var projectRoot = '';

function executeCommand(cmd, callback) {
  cmd = 'echo \'cd "'+ projectRoot + '" && '+ cmd + '\' | bash --login';
  exec(cmd, function (error, stdout, stderr) {
    if (error !== null) {
      return callback(error);
    }
    var result = stdout;
    try {
      result = JSON.parse(stdout);
    } catch (e) {}
    
    callback(null, result); 
  });
}


function setProjectRoot(root) {
  projectRoot = root;
}


/**
 * Initializes the test domain with several test commands.
 * @param {DomainManager} domainManager The DomainManager for the server
 */
function init(domainManager) {
    if (!domainManager.hasDomain("flow")) {
        domainManager.registerDomain("flow", {major: 0, minor: 1});
    }
    domainManager.registerCommand(
        "flow",       // domain name
        "executeCommand",    // command name
        executeCommand,   // command handler function
        true,          // this command is synchronous in Node
        "Returns the total or free memory on the user's system in bytes",
        [{commande: "command", type: "string", description: "command to execute"}]
    );
  
    domainManager.registerCommand(
        "flow",       // domain name
        "setProjectRoot",    // command name
        setProjectRoot,   // command handler function
        false,          // this command is synchronous in Node
        "Returns the total or free memory on the user's system in bytes",
        [{commande: "command", type: "string", description: "command to execute"}]
    );
}


exports.init = init; 
