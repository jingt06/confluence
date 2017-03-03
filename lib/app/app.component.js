import {Component} from '@angular/core';

(function(app) {
  console.log(window, 'module load', app);
  app.AppComponent =
    Component({
      selector: 'my-app',
      template: '<h1>Hello Angular</h1>',
    })
    .Class({
      constructor: function AppComponent() {},
    });
})(window.app || (window.app = {}));
