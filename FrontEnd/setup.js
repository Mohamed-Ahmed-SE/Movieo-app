#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎬 Movieo App Setup\n');

// Check if .env file already exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file already exists');
  rl.question('Do you want to update your API token? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      promptForToken();
    } else {
      console.log('Setup complete! Run "npm run dev" to start the app.');
      rl.close();
    }
  });
} else {
  promptForToken();
}

function promptForToken() {
  console.log('\n📝 TMDB API Token Setup');
  console.log('1. Visit: https://www.themoviedb.org/settings/api');
  console.log('2. Create an account or sign in');
  console.log('3. Request an API key (v3 auth)');
  console.log('4. Copy the API key (v3 auth) token\n');
  
  rl.question('Enter your TMDB API token: ', (token) => {
    if (token && token.trim() !== '') {
      createEnvFile(token.trim());
    } else {
      console.log('❌ No token provided. Setup cancelled.');
      rl.close();
    }
  });
}

function createEnvFile(token) {
  const envContent = `# TMDB API Configuration
VITE_TMDB_API_TOKEN=${token}

# Optional: Development settings
# VITE_DEBUG_MODE=true
# VITE_API_TIMEOUT=10000
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('🚀 You can now run "npm run dev" to start the app.');
    console.log('\n📖 For more information, check the README.md file.');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
  
  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Setup cancelled. Goodbye!');
  process.exit(0);
}); 