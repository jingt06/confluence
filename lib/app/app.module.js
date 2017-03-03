import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser'
import './app.component';
(function(app) {
  console.log('module load', app);
  app.AppModule =
    NgModule({
      imports: [ BrowserModule ],
      declarations: [ app.AppComponent ],
      bootstrap: [ app.AppComponent ]
    })
    .Class({
      constructor: function AppModule() {},
    });
})(window.app || (window.app = {}));
