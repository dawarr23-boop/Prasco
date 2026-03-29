#!/bin/bash
# Quick deployment script for Raspberry Pi
# Usage: ./deploy-quick.sh

echo "🚀 PRASCO Quick Deployment to Raspberry Pi"
echo "=========================================="

# Configuration
PI_HOST="${PI_HOST:-pi@192.168.2.47}"
PI_PATH="/home/pi/prasco"

echo ""
echo "Target: $PI_HOST:$PI_PATH"
echo ""

# Step 1: Build
echo "📦 Building for Raspberry Pi..."
npm run build:pi

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Step 2: Deploy
echo "🚀 Deploying to Raspberry Pi..."

# Copy environment
echo "   📋 Copying environment..."
scp .env.pi $PI_HOST:$PI_PATH/.env

# Copy dist
echo "   📦 Copying application..."
scp -r dist $PI_HOST:$PI_PATH/

# Copy static assets
echo "   🎨 Copying assets..."
scp css/admin.css css/display.css $PI_HOST:$PI_PATH/css/
scp js/admin.js js/display.js $PI_HOST:$PI_PATH/js/

# Copy views
echo "   📄 Copying views..."
scp -r views/* $PI_HOST:$PI_PATH/views/

echo ""
echo "✅ Files deployed"
echo ""

# Step 3: Restart service
echo "🔄 Restarting service..."
ssh $PI_HOST "cd $PI_PATH && pm2 restart prasco"

if [ $? -ne 0 ]; then
    echo "❌ Service restart failed!"
    exit 1
fi

echo "✅ Service restarted"
echo ""

# Step 4: Show status
echo "📊 Service Status:"
ssh $PI_HOST "pm2 status prasco"

echo ""
echo "✨ Deployment complete!"
echo ""
echo "View logs: ssh $PI_HOST 'pm2 logs prasco'"
echo "Monitor: ssh $PI_HOST 'pm2 monit'"
