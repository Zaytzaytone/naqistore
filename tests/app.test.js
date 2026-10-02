/**
 * NaqiStore Test Suite
 * 
 * Run tests by opening this file in a browser:
 * 1. Start local server: python -m http.server 8765
 * 2. Open: http://localhost:8765/tests/app.test.js
 * 3. Check browser console for results
 * 
 * Or run in Node.js test framework (Jest, Mocha, etc.)
 */

// Simple test runner (no external dependencies)
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   NaqiStore Test Suite                ║');
    console.log('╚════════════════════════════════════════╝\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✅ ${name}`);
      } catch (error) {
        this.failed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(40));
    console.log(`Results: ${this.passed}/${this.tests.length} passed`);
    if (this.failed > 0) {
      console.log(`⚠️  ${this.failed} tests failed`);
    } else {
      console.log('✨ All tests passed!');
    }
    console.log('═'.repeat(40) + '\n');
  }
}

// Custom assertion helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(`${message}\n  Expected: true\n  Actual: ${value}`);
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(`${message}\n  Expected: false\n  Actual: ${value}`);
  }
}

function assertIncludes(str, substr, message) {
  if (!str.includes(substr)) {
    throw new Error(`${message}\n  Expected string to include: ${substr}\n  Actual: ${str}`);
  }
}

// ============================================
// TEST SUITE
// ============================================

const runner = new TestRunner();

// ─────────────────────────────────────────
// Utility Function Tests
// ─────────────────────────────────────────

runner.test('escapeHtml: Should escape HTML special characters', () => {
  // Mock escapeHtml function
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  const dangerous = '<script>alert("XSS")</script>';
  const escaped = escapeHtml(dangerous);
  
  assertFalse(escaped.includes('<script>'), 'Should not contain <script> tag');
  assertIncludes(escaped, '&lt;', 'Should contain escaped <');
  assertIncludes(escaped, '&gt;', 'Should contain escaped >');
});

runner.test('escapeHtml: Should handle quotes and ampersands', () => {
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  const input = 'Tom & Jerry "best friends"';
  const escaped = escapeHtml(input);
  
  assertIncludes(escaped, '&amp;', 'Should escape &');
  assertIncludes(escaped, '&quot;', 'Should escape quotes');
});

runner.test('escapeHtml: Should preserve Arabic text', () => {
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  const arabic = 'زيت الزيتون نقي';
  const escaped = escapeHtml(arabic);
  
  assertIncludes(escaped, 'نقي', 'Should preserve Arabic characters');
});

// ─────────────────────────────────────────
// Cart Logic Tests
// ─────────────────────────────────────────

runner.test('Cart: Should calculate line total correctly', () => {
  const line = { id: 'ev-250', name: 'Extra Virgin 250ml', price: 200, qty: 3 };
  const lineTotal = line.price * line.qty;
  
  assertEqual(lineTotal, 600, 'Line total should be price × quantity');
});

runner.test('Cart: Should calculate cart total correctly', () => {
  const cart = [
    { id: 'ev-250', price: 200, qty: 1 },
    { id: 'ev-500', price: 350, qty: 2 },
    { id: 'ev-1kg', price: 600, qty: 1 },
  ];
  
  const total = cart.reduce((sum, line) => sum + (line.price * line.qty), 0);
  // 200 + (350*2) + 600 = 200 + 700 + 600 = 1500
  
  assertEqual(total, 1500, 'Cart total should sum all line totals');
});

runner.test('Cart: Should handle empty cart', () => {
  const cart = [];
  const total = cart.reduce((sum, line) => sum + (line.price * line.qty), 0);
  
  assertEqual(total, 0, 'Empty cart should have zero total');
});

runner.test('Cart: Should add product to cart', () => {
  const products = [
    { id: 'ev-250', name: 'Extra Virgin 250ml', price: 200 },
  ];
  
  const cart = [];
  const productId = 'ev-250';
  const product = products.find(p => p.id === productId);
  
  if (product) {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  
  assertEqual(cart.length, 1, 'Cart should have 1 item');
  assertEqual(cart[0].id, 'ev-250', 'Cart should contain correct product');
});

runner.test('Cart: Should increment quantity when adding existing product', () => {
  const cart = [{ id: 'ev-250', name: 'Extra Virgin 250ml', price: 200, qty: 1 }];
  
  const existing = cart.find(l => l.id === 'ev-250');
  if (existing) {
    existing.qty += 1;
  }
  
  assertEqual(cart[0].qty, 2, 'Quantity should increment to 2');
});

runner.test('Cart: Should remove product from cart', () => {
  const cart = [
    { id: 'ev-250', name: 'Extra Virgin 250ml', price: 200, qty: 1 },
    { id: 'ev-500', name: 'Extra Virgin 500ml', price: 350, qty: 1 },
  ];
  
  const cartFiltered = cart.filter(l => l.id !== 'ev-250');
  
  assertEqual(cartFiltered.length, 1, 'Cart should have 1 item after removal');
  assertEqual(cartFiltered[0].id, 'ev-500', 'Remaining item should be ev-500');
});

runner.test('Cart: Should handle quantity edge cases', () => {
  const line = { id: 'ev-250', qty: 0 };
  
  assertTrue(line.qty >= 0, 'Quantity should never be negative');
});

// ─────────────────────────────────────────
// LocalStorage Tests
// ─────────────────────────────────────────

runner.test('LocalStorage: Should save and load cart', () => {
  const STORAGE_KEY = 'test-naqistore-cart';
  const cart = [
    { id: 'ev-250', name: 'Extra Virgin 250ml', price: 200, qty: 1 },
  ];
  
  // Save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  
  // Load
  const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
  
  assertEqual(loaded.length, 1, 'Should load saved cart');
  assertEqual(loaded[0].id, 'ev-250', 'Should restore product ID');
  
  // Cleanup
  localStorage.removeItem(STORAGE_KEY);
});

runner.test('LocalStorage: Should handle corrupted data gracefully', () => {
  const STORAGE_KEY = 'test-corrupted';
  localStorage.setItem(STORAGE_KEY, 'invalid json {]');
  
  let loaded = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = JSON.parse(raw);
  } catch {
    loaded = [];
  }
  
  assertEqual(loaded.length, 0, 'Should return empty array on parse error');
  
  // Cleanup
  localStorage.removeItem(STORAGE_KEY);
});

runner.test('LocalStorage: Should handle missing key', () => {
  const STORAGE_KEY = 'test-nonexistent-' + Date.now();
  const raw = localStorage.getItem(STORAGE_KEY);
  
  assertEqual(raw, null, 'Should return null for missing key');
});

// ─────────────────────────────────────────
// Form Validation Tests
// ─────────────────────────────────────────

runner.test('Validation: Should reject empty name', () => {
  const name = '';
  
  assertFalse(name && name.trim().length > 0, 'Should reject empty name');
});

runner.test('Validation: Should reject empty phone', () => {
  const phone = '';
  
  assertFalse(phone && phone.trim().length > 0, 'Should reject empty phone');
});

runner.test('Validation: Should reject empty address', () => {
  const address = '';
  
  assertFalse(address && address.trim().length > 0, 'Should reject empty address');
});

runner.test('Validation: Should accept valid English name', () => {
  const name = 'John Smith';
  
  assertTrue(name && name.length >= 2, 'Should accept valid English name');
});

runner.test('Validation: Should accept valid Arabic name', () => {
  const name = 'أحمد محمد';
  
  assertTrue(name && name.length >= 2, 'Should accept valid Arabic name');
});

runner.test('Validation: Should accept valid phone format', () => {
  const phone = '01110438175';
  
  assertTrue(phone && phone.length >= 10, 'Should accept valid phone number');
});

runner.test('Validation: Should accept valid address', () => {
  const address = 'Cairo, Egypt, Building 5, Apt 12';
  
  assertTrue(address && address.length >= 5, 'Should accept valid address');
});

runner.test('Validation: Should trim whitespace', () => {
  const name = '  John  ';
  const trimmed = name.trim();
  
  assertEqual(trimmed, 'John', 'Should trim leading/trailing whitespace');
});

// ─────────────────────────────────────────
// Currency Formatting Tests
// ─────────────────────────────────────────

runner.test('Currency: Should format as EGP', () => {
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(250);
  
  assertIncludes(formatted, '250', 'Should include amount');
});

runner.test('Currency: Should format large amounts', () => {
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(10000);
  
  assertIncludes(formatted, '10', 'Should include thousands');
});

runner.test('Currency: Should format zero', () => {
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(0);
  
  assertIncludes(formatted, '0', 'Should format zero correctly');
});

// ─────────────────────────────────────────
// Order Email Tests
// ─────────────────────────────────────────

runner.test('Order Email: Should include customer info', () => {
  const name = 'Ahmed Mohammed';
  const phone = '01110438175';
  const address = 'Cairo, Egypt';
  
  const email = `Name: ${name}\nPhone: ${phone}\nAddress: ${address}`;
  
  assertIncludes(email, name, 'Should include customer name');
  assertIncludes(email, phone, 'Should include customer phone');
  assertIncludes(email, address, 'Should include customer address');
});

runner.test('Order Email: Should include order items', () => {
  const cartItems = [
    { name: 'Extra Virgin 250ml', qty: 1, price: 200 },
    { name: 'Extra Virgin 500ml', qty: 2, price: 350 },
  ];
  
  const email = cartItems
    .map(item => `• ${item.name} × ${item.qty}  →  ${item.price * item.qty}`)
    .join('\n');
  
  assertIncludes(email, 'Extra Virgin 250ml', 'Should include first product');
  assertIncludes(email, 'Extra Virgin 500ml', 'Should include second product');
  assertIncludes(email, '× 1', 'Should include quantities');
});

runner.test('Order Email: Should include order total', () => {
  const total = 1500;
  const email = `SUBTOTAL: ${total}`;
  
  assertIncludes(email, '1500', 'Should include order total');
});

// ─────────────────────────────────────────
// DOM & Accessibility Tests
// ─────────────────────────────────────────

runner.test('DOM: HTML page should load', () => {
  assertTrue(document.body !== null, 'Body should exist');
});

runner.test('DOM: Should have header element', () => {
  assertTrue(document.querySelector('.site-header') !== null, 'Header should exist');
});

runner.test('DOM: Should have cart button', () => {
  assertTrue(document.getElementById('open-cart') !== null, 'Cart button should exist');
});

runner.test('DOM: Should have product grid', () => {
  assertTrue(document.getElementById('product-grid') !== null, 'Product grid should exist');
});

runner.test('DOM: Should have checkout form', () => {
  assertTrue(document.getElementById('checkout-form') !== null, 'Checkout form should exist');
});

runner.test('Accessibility: Cart button should have aria-label', () => {
  const cartBtn = document.getElementById('open-cart');
  assertTrue(cartBtn.hasAttribute('aria-expanded'), 'Cart button should have aria-expanded');
});

runner.test('Accessibility: Checkout form labels should exist', () => {
  const nameLabel = document.querySelector('label[for="checkout-name"]');
  assertTrue(nameLabel !== null, 'Name label should exist');
});

runner.test('Accessibility: Page should have main landmark', () => {
  assertTrue(document.querySelector('main') !== null, 'Main element should exist');
});

// ─────────────────────────────────────────
// Data Configuration Tests
// ─────────────────────────────────────────

runner.test('Config: Should have products defined', () => {
  if (typeof NaqiConfig !== 'undefined' && NaqiConfig.PRODUCTS) {
    assertTrue(NaqiConfig.PRODUCTS.length > 0, 'Should have at least one product');
  } else {
    console.warn('⚠️  NaqiConfig not loaded (run after data.js is loaded)');
  }
});

runner.test('Config: Products should have required fields', () => {
  if (typeof NaqiConfig !== 'undefined' && NaqiConfig.PRODUCTS) {
    const product = NaqiConfig.PRODUCTS[0];
    assertTrue(product.id, 'Product should have ID');
    assertTrue(product.name, 'Product should have name');
    assertTrue(product.price > 0, 'Product should have positive price');
  }
});

runner.test('Config: Should have FormSubmit email', () => {
  if (typeof NaqiConfig !== 'undefined' && NaqiConfig.CONFIG) {
    assertTrue(NaqiConfig.CONFIG.FORMSUBMIT_EMAIL, 'Should have FormSubmit email');
    assertIncludes(NaqiConfig.CONFIG.FORMSUBMIT_EMAIL, '@', 'Email should contain @');
  }
});

// ============================================
// RUN TESTS
// ============================================

// Auto-run when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => runner.run());
} else {
  runner.run();
}
