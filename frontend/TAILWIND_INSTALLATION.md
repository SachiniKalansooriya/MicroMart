# Complete Tailwind CSS Setup - Run These Commands

## Step 1: Clean Installation (run in PowerShell)

```powershell
# Navigate to frontend directory
cd D:\MicroMart\frontend

# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall everything
npm install

# Install Tailwind CSS v4 specifically
npm install -D tailwindcss@latest @tailwindcss/postcss@latest autoprefixer@latest
```

## Step 2: Verify Configuration Files

Make sure these files have the correct content:

### `src/index.css`
```css
@import "tailwindcss";
```

### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `postcss.config.js`
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

## Step 3: Rebuild & Restart

```powershell
# Build the project
npm run build

# Start dev server
npm run dev
```

## Step 4: Clear Browser Cache

In your browser:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

Or use keyboard shortcut: **Ctrl + Shift + R**

## Troubleshooting

If styles still don't work:

### Check if Tailwind is generating CSS:
```powershell
npm run build
```
Look at the output - the CSS file should be around 10-15 KB.

### Check browser console:
1. Press F12
2. Look for any CSS loading errors
3. Check the Network tab to see if CSS is loaded

### Verify imports in main.tsx:
```typescript
import './index.css'  // This line must be present
```

### Alternative: Use Tailwind v3 (if v4 continues to fail)
```powershell
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@3 postcss autoprefixer

# Update src/index.css to:
@tailwind base;
@tailwind components;
@tailwind utilities;

# Update postcss.config.js to:
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

npm run dev
```

## Quick Test

After restarting, the page should show:
- Blue/indigo navigation bar
- Styled buttons
- Centered forms with shadows
- Proper spacing and colors

If you still see plain HTML, there's likely a CSS loading issue in your browser.
