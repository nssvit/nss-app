#!/bin/bash

# PWA Icon Generator Script for TaskPilot
# This script helps you create the required PWA icon sizes

echo "🎨 TaskPilot PWA Icon Generator"
echo "================================"
echo ""

# Create the public directory if it doesn't exist
mkdir -p public

# Check if we have a source icon
if [ ! -f "public/icon-source.png" ]; then
    echo "❌ Missing source icon file: public/icon-source.png"
    echo ""
    echo "Please provide a high-resolution source icon (512x512 or larger) named 'icon-source.png' in the public directory."
    echo ""
    echo "Alternative options:"
    echo "1. Use an online PWA icon generator:"
    echo "   - https://realfavicongenerator.net/"
    echo "   - https://www.pwabuilder.com/"
    echo "   - https://maskable.app/editor"
    echo ""
    echo "2. Create icons manually with these sizes:"
    echo "   - icon-72x72.png"
    echo "   - icon-96x96.png"
    echo "   - icon-128x128.png"
    echo "   - icon-144x144.png"
    echo "   - icon-152x152.png"
    echo "   - icon-192x192.png"
    echo "   - icon-384x384.png"
    echo "   - icon-512x512.png"
    echo ""
    echo "3. Use the template SVG (public/icon-template.svg) as a starting point"
    exit 1
fi

# Check if ImageMagick is installed (for automatic resizing)
if command -v convert >/dev/null 2>&1; then
    echo "✅ ImageMagick found - generating icons automatically"
    echo ""
    
    # Define icon sizes
    sizes=(72 96 128 144 152 192 384 512)
    
    # Generate each size
    for size in "${sizes[@]}"; do
        echo "Generating ${size}x${size} icon..."
        convert public/icon-source.png -resize ${size}x${size} public/icon-${size}x${size}.png
    done
    
    echo ""
    echo "✅ All PWA icons generated successfully!"
    echo "Icons created in public/ directory:"
    ls -la public/icon-*.png
    
else
    echo "⚠️  ImageMagick not found"
    echo ""
    echo "To automatically generate icons, install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "Or use online tools mentioned above."
fi

echo ""
echo "🚀 Next steps:"
echo "1. Review generated icons in public/ directory"
echo "2. Restart your dev server: npm run dev"
echo "3. Test PWA installation in Chrome/Edge"
echo "4. Deploy and test on mobile devices"
