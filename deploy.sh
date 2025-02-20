#!binbash

# Install dependencies
npm install

# Create build directory
rm -rf build
mkdir build

# Copy and minify static files
cp index.html build
cp styles.css build
cp chat-styles.css build
cp script.js build
cp server.js build
cp package.json build

# Install production dependencies in build directory
cd build
npm install --production
cd ..

# Create production zip
zip -r chat-app-production.zip build

echo Build completed! Upload the following files to your hosting
echo 1. All files in the 'build' directory
echo 2. Or use the chat-app-production.zip file
echo 
echo For Netlify deployment
echo 1. Go to httpsapp.netlify.com
echo 2. Create new site from Git
echo 3. Connect to your repository
echo 4. Deploy settings are already configured in netlify.toml
