#!/bin/bash

# Deployment script for cPanel

# Step 1: Package the application
echo "Packaging the application..."
npm run build
zip -r chat-app.zip ./*

# Step 2: Instructions for cPanel deployment
echo ""
echo "Deployment Instructions:"
echo "1. Log in to your cPanel account"
echo "2. Go to the 'File Manager'"
echo "3. Navigate to your desired directory (e.g., public_html)"
echo "4. Upload the chat-app.zip file"
echo "5. Extract the zip file in the directory"
echo "6. Create a new database in cPanel"
echo "7. Import the database schema (if needed)"
echo "8. Set up environment variables in cPanel:"
echo "   - MONGO_URI: Your MongoDB connection string"
echo "   - PORT: 3000 (or your desired port)"
echo "   - JWT_SECRET: Your secret key for JWT"
echo "9. Set up Node.js application in cPanel:"
echo "   - Application root: The directory where you extracted the files"
echo "   - Application URL: Your domain/subdomain"
echo "   - Application startup file: server.js"
echo "10. Start the application"
echo ""
echo "Note: Make sure your cPanel hosting supports Node.js applications."
