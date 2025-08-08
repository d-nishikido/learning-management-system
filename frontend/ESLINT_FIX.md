# ESLint Configuration Fix

## Issue
ESLint commands fail with error: "Cannot find module '../package.json'"

## Root Cause
This error occurs due to workspace configuration conflicts between the root `node_modules` and the frontend `node_modules`. The ESLint binary is looking for a package.json file relative to its installation location, which conflicts with the workspace structure.

## Solution
To fix this issue, follow these steps:

### 1. Clean Installation
```bash
# From the root directory
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json frontend/package-lock.json backend/package-lock.json

# Install dependencies fresh
npm install
```

### 2. Alternative: Use npx with explicit path
```bash
# From frontend directory
npx --prefix . eslint src
```

### 3. Alternative: Use workspace command
```bash
# From root directory
npm run lint --workspace=frontend
```

### 4. Alternative: Update package.json scripts
Update the frontend package.json lint scripts to use explicit paths:

```json
{
  "scripts": {
    "lint": "./node_modules/.bin/eslint .",
    "lint:fix": "./node_modules/.bin/eslint . --fix"
  }
}
```

## ESLint Configuration Status
The ESLint configuration file (`eslint.config.js`) is properly configured with:
- TypeScript support
- React hooks rules
- React refresh rules
- Prettier integration
- Appropriate ignores for dist, node_modules, coverage, build

## Recommended Action
Perform a clean installation as described in step 1 to resolve the workspace conflicts.