# Security Patch for bigint-buffer

This directory contains a patched version of the `bigint-buffer` package to address CVE-2025-3194.

## Vulnerability Details
- **CVE**: CVE-2025-3194
- **GitHub Advisory**: GHSA-3gc7-fjrx-p6mg
- **Severity**: High (7.7/10)
- **Issue**: Buffer Overflow in the toBigIntLE() function
- **Affected Versions**: All versions <= 1.1.5
- **Official Fix**: None available (package not maintained)

## Our Solution
Since no official patch is available, we created a safe implementation that:
1. Adds proper bounds checking to prevent buffer overflow
2. Uses built-in DataView for safe buffer operations
3. Maintains the same API compatibility
4. Throws appropriate errors for invalid input

## Implementation
The patched version is applied via npm overrides in package.json:
```json
"overrides": {
  "bigint-buffer": "file:./bigint-buffer-safe"
}
```

## Testing
The patch has been tested with:
- Application build process (npm run build)
- All Solana Pay functionality
- Buffer operations in the dependency chain

## Maintenance
This patch should be reviewed when:
1. An official fix is released for bigint-buffer
2. Solana packages are updated to use alternative dependencies
3. We migrate to newer Solana Web3.js versions that don't use this dependency

## Verification
Run `npm audit` to verify no vulnerabilities are present.
Run `npm list bigint-buffer` to confirm the override is working.
