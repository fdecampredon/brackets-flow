/*global define, brackets, console  */

define(function (require, exports, module) {
  'use strict';

  //---------------------------------------
  //
  // Import
  //
  //---------------------------------------

  var AppInit = brackets.getModule('utils/AppInit');
  var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
  var NodeConnection = brackets.getModule("utils/NodeConnection");
  var nodeConnection= new NodeConnection();
  
  var init = require('./bundle');

  //---------------------------------------
  //
  // Node connection management
  //
  //---------------------------------------


  /**
   * Helper function to connect to node
   */ 
  function connect() {
    var connectionPromise = nodeConnection.connect(true);
    connectionPromise.fail(function () {
      console.error("[brackets-simple-node] failed to connect to node");
    });
    return connectionPromise; 
  }

  /**
   * Helper function that loads our domain into the node server
   */ 
  function loadDomain() {
    var path = ExtensionUtils.getModulePath(module, "node/flowDomain");
    var loadPromise = nodeConnection.loadDomains([path], true);
    loadPromise.fail(function () {
      console.log("[brackets-simple-node] failed to load domain");
    });
    return loadPromise;
  }

  //---------------------------------------
  //
  // Init
  //
  //---------------------------------------

  AppInit.appReady(function () {
    connect().then(loadDomain).then(function () {
      init(nodeConnection);
    });
  });
});