import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import LayoutComponent from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component:LayoutComponent,
    children:[]
  }
];
