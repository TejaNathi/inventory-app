import './js/inventory-app-core.js';

import {
  addRequestRow,
  clearRaiseRequest,
  initializeRaiseRequest,
  submitRequest,
} from './js/raise-request.js';

initializeRaiseRequest();

Object.assign(window, {
  addRequestRow,
  clearRaiseRequest,
  submitRequest,
});
