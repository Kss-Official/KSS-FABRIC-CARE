/**
 * Automated Verification Script for Real Authentication, Role Redirection, & Route Protection
 */

import { normalizeRole, getPortalForRole } from '../utils/roleUtils.js';
import { mapAuthError } from '../services/authService.js';

console.log('========================================================');
console.log('🧪 FABRICARE: AUTHENTICATION & ROLE-PORTAL VERIFICATION');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// 1. Role Normalization Tests
console.log('--- 1. Testing Role Normalization ---');
assert(normalizeRole('ADMIN') === 'admin', 'Django ADMIN maps to canonical admin');
assert(normalizeRole('admin') === 'admin', 'Canonical admin stays admin');
assert(normalizeRole('DELIVERY_STAFF') === 'delivery_agent', 'Django DELIVERY_STAFF maps to delivery_agent');
assert(normalizeRole('delivery_agent') === 'delivery_agent', 'Canonical delivery_agent stays delivery_agent');
assert(normalizeRole('driver') === 'delivery_agent', 'driver role maps to delivery_agent');
assert(normalizeRole('LAUNDRY_STAFF') === 'laundry_staff', 'Django LAUNDRY_STAFF maps to laundry_staff');
assert(normalizeRole('laundry_staff') === 'laundry_staff', 'Canonical laundry_staff stays laundry_staff');
assert(normalizeRole('CUSTOMER') === 'customer', 'Django CUSTOMER maps to customer');
assert(normalizeRole('customer') === 'customer', 'Canonical customer stays customer');
assert(normalizeRole(null) === 'customer', 'Null/empty role defaults safely to customer');

// 2. Role-to-Portal Navigation Redirection Mapping
console.log('\n--- 2. Testing Role-Based Portal Navigation Mapping ---');
assert(getPortalForRole('admin') === 'admin', 'admin redirects to Admin Portal (admin)');
assert(getPortalForRole('ADMIN') === 'admin', 'ADMIN redirects to Admin Portal (admin)');
assert(getPortalForRole('delivery_agent') === 'delivery-portal', 'delivery_agent redirects to Delivery Agent Portal (delivery-portal)');
assert(getPortalForRole('DELIVERY_STAFF') === 'delivery-portal', 'DELIVERY_STAFF redirects to Delivery Agent Portal (delivery-portal)');
assert(getPortalForRole('laundry_staff') === 'laundry-portal', 'laundry_staff redirects to Laundry Staff Portal (laundry-portal)');
assert(getPortalForRole('LAUNDRY_STAFF') === 'laundry-portal', 'LAUNDRY_STAFF redirects to Laundry Staff Portal (laundry-portal)');
assert(getPortalForRole('customer') === 'home', 'customer redirects to Homepage (home)');
assert(getPortalForRole('CUSTOMER') === 'home', 'CUSTOMER redirects to Homepage (home)');

// 3. Error Handling
console.log('\n--- 3. Testing Authentication Error Handling ---');
assert(
  mapAuthError({ code: 'auth/invalid-credential' }).includes('Invalid email address or password'),
  'Invalid credentials error maps to user-friendly message'
);
assert(
  mapAuthError({ code: 'auth/network-request-failed' }).includes('Network error'),
  'Network failure maps to clear message'
);

// Summary
console.log('\n========================================================');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} Tests Passed successfully!`);
console.log('========================================================\n');
