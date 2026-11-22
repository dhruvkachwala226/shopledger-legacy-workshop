'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('inventory check accepts a quantity below sellable stock', function () {
  var products = [{
    id: 6,
    sku: 'DRY-001',
    name: 'Dry fruit jar',
    stock: 3,
    reserved: 1
  }];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), {
    ok: true
  });
});

test('inventory check accepts the exact remaining sellable stock', function () {
  var products = [{
    id: 6,
    sku: 'DRY-001',
    name: 'Dry fruit jar',
    stock: 2,
    reserved: 1
  }];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), {
    ok: true
  });
});

test('inventory check rejects duplicate lines that exceed sellable stock in total', function () {
  var products = [{
    id: 6,
    sku: 'DRY-001',
    name: 'Dry fruit jar',
    stock: 1,
    reserved: 0
  }];

  assert.deepEqual(inventory.check(products, [
    { id: 6, qty: 1 },
    { id: 6, qty: 1 }
  ]), {
    ok: false,
    msg: 'Dry fruit jar is out of stock (1 sellable available)'
  });
});

test('cancelling a pending order changes status and restores stock', function () {
  var dryProduct = {
    id: 6,
    sku: 'DRY-001',
    name: 'Dry fruit jar',
    stock: 1,
    reserved: 0
  };
  var oilProduct = {
    id: 4,
    sku: 'OIL-001',
    name: 'Sunflower oil',
    stock: 22,
    reserved: 4
  };
  var order = {
    id: 1007,
    status: 'pending',
    paymentMode: 'cash',
    customerId: null,
    items: [
      { id: 6, sku: 'DRY-001', qty: 2 },
      { id: 4, sku: 'OIL-001', qty: 2 }
    ],
    total: 1407
  };
  var db = {
    products: [dryProduct, oilProduct],
    orders: [order],
    customers: []
  };

  var result = orders.cancel(db, 1007, 'Customer changed their mind');

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.equal(order.cancelReason, 'Customer changed their mind');
  assert.equal(dryProduct.stock, 3);
  assert.equal(dryProduct.reserved, 0);
  assert.equal(oilProduct.stock, 24);
  assert.equal(oilProduct.reserved, 4);
});
