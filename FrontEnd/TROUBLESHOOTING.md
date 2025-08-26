# 🐛 Troubleshooting Guide

This guide helps you resolve common issues with the Movieo app.

## 🚨 Common Issues & Solutions

### 1. No Content in Dropdown Menus

**Problem**: Dropdown menus show no content or empty results.

**Causes**:
- Missing or invalid TMDB API token
- Network connectivity issues
- API rate limiting

**Solutions**:
1. **Set up API token**:
   ```bash
   # Run the setup script
   npm run setup
   
   # Or manually create .env file
   echo "VITE_TMDB_API_TOKEN=your_actual_token_here" > .env
   ```

2. **Get a valid API token**:
   - Visit [TMDB Settings](https://www.themoviedb.org/settings/api)
   - Create an account or sign in
   - Request an API key (v3 auth)
   - Copy the API key (v3 auth) token

3. **Check browser console** for API errors
4. **Verify internet connection**
5. **Wait a few minutes** if rate limited

### 2. Empty Search Results

**Problem**: Search returns no results.

**Solutions**:
1. **Verify API token** is valid and properly configured
2. **Check TMDB API status** at [TMDB Status](https://status.themoviedb.org/)
3. **Clear browser cache** and try again
4. **Check search query** - try different keywords
5. **Verify network connectivity**

### 3. Images Not Loading

**Problem**: Movie/TV show posters and backdrops don't load.

**Solutions**:
1. **Check TMDB API status**
2. **Verify image URLs** in browser console
3. **Check network connectivity**
4. **Clear browser cache**
5. **Try refreshing the page**

### 4. Watchlist Not Saving

**Problem**: Can't save items to watchlist.

**Solutions**:
1. **Check browser storage permissions**
2. **Clear browser data** if needed
3. **Verify localStorage is enabled**
4. **Try in incognito/private mode**
5. **Check browser console** for errors

### 5. App Not Starting

**Problem**: Development server won't start.

**Solutions**:
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Check Node.js version** (requires v16+):
   ```bash
   node --version
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

4. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 6. Build Errors

**Problem**: Production build fails.

**Solutions**:
1. **Check for syntax errors** in console
2. **Verify all imports** are correct
3. **Check environment variables** are set
4. **Clear build cache**:
   ```bash
   npm run build -- --force
   ```

### 7. Performance Issues

**Problem**: App is slow or unresponsive.

**Solutions**:
1. **Check API rate limiting** - wait a few minutes
2. **Reduce network requests** - implement caching
3. **Optimize images** - use appropriate sizes
4. **Check browser performance** tools
5. **Clear browser cache**

## 🔧 Debug Mode

Enable debug logging to get more information:

1. **Add debug environment variable**:
   ```bash
   echo "VITE_DEBUG_MODE=true" >> .env
   ```

2. **Check browser console** for detailed logs

3. **Monitor network requests** in browser dev tools

## 📊 API Status Check

### TMDB API Health
- **Status Page**: [TMDB Status](https://status.themoviedb.org/)
- **API Documentation**: [TMDB API Docs](https://developers.themoviedb.org/)

### Rate Limiting
TMDB has rate limits:
- **Free tier**: 1000 requests per day
- **Paid tier**: Higher limits available

If you hit rate limits:
1. Wait a few minutes before making more requests
2. Implement request caching
3. Consider upgrading to paid tier

## 🌐 Network Issues

### Check Connectivity
```bash
# Test internet connection
ping google.com

# Test DNS resolution
nslookup api.themoviedb.org

# Test API endpoint
curl -I https://api.themoviedb.org/3/configuration
```

### Proxy/Firewall Issues
If behind a corporate firewall:
1. **Configure proxy settings** in your environment
2. **Check firewall rules** allow outbound HTTPS
3. **Contact IT department** if needed

## 🔍 Browser-Specific Issues

### Chrome/Chromium
1. **Clear browsing data**
2. **Disable extensions** temporarily
3. **Check security settings**

### Firefox
1. **Clear cookies and site data**
2. **Disable tracking protection** temporarily
3. **Check privacy settings**

### Safari
1. **Clear website data**
2. **Disable content blockers** temporarily
3. **Check privacy settings**

### Edge
1. **Clear browsing data**
2. **Disable tracking prevention** temporarily
3. **Check security settings**

## 📱 Mobile Issues

### iOS Safari
1. **Clear website data**
2. **Disable content blockers**
3. **Check privacy settings**

### Android Chrome
1. **Clear browsing data**
2. **Disable data saver**
3. **Check site settings**

## 🛠️ Development Issues

### Hot Reload Not Working
1. **Check file watchers** limit:
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server**:
   ```bash
   npm run dev
   ```

### ESLint Errors
1. **Fix linting errors** in console
2. **Run linting manually**:
   ```bash
   npx eslint src/
   ```

### TypeScript Errors
1. **Check type definitions**
2. **Update dependencies** if needed
3. **Clear TypeScript cache**

## 📞 Getting Help

### Before Asking for Help
1. **Check this troubleshooting guide**
2. **Search existing issues** in the repository
3. **Check browser console** for errors
4. **Verify API token** is properly configured
5. **Test in incognito/private mode**

### When Reporting Issues
Include the following information:
1. **Browser and version**
2. **Operating system**
3. **Node.js version**
4. **Error messages** from console
5. **Steps to reproduce**
6. **Expected vs actual behavior**

### Useful Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check installed packages
npm list

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run setup script
npm run setup

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Quick Fixes

### Most Common Solutions
1. **Set up API token** - 90% of issues
2. **Clear browser cache** - 5% of issues
3. **Check internet connection** - 3% of issues
4. **Restart development server** - 2% of issues

### Emergency Reset
If nothing else works:
```bash
# Complete reset
rm -rf node_modules package-lock.json .env
npm install
npm run setup
npm run dev
```

---

**Still having issues?** Check the [README.md](README.md) for more detailed setup instructions. 