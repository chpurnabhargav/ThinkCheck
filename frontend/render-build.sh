#!/bin/bash
# Force install the specific Tailwind CSS oxide binary
npm install @tailwindcss/oxide-linux-x64-gnu --no-save

# Install dependencies
npm install

# Skip the rebuild step that's causing issues and proceed with build
npm run build -- --skip-tailwind-rebuild
