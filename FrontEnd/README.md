# Movieo - Movie & TV Show Discovery App

A modern, responsive movie and TV show discovery application built with React, featuring beautiful animations, comprehensive search, and an intuitive user interface.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- TMDB API token (free)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd FrontEnd
   npm install
   ```

2. **Set up TMDB API Token**
   
   **Get your API token:**
   - Visit [TMDB Website](https://www.themoviedb.org/)
   - Create an account or sign in
   - Go to [API Settings](https://www.themoviedb.org/settings/api)
   - Request an API key (v3 auth)
   - Copy the API key (v3 auth) token

   **Configure the token:**
   
   Option A: Create `.env` file (Recommended)
   ```bash
   # Create .env file in FrontEnd directory
   echo "VITE_TMDB_API_TOKEN=your_actual_token_here" > .env
   ```
   
   Option B: Set environment variable
   ```bash
   export VITE_TMDB_API_TOKEN=your_actual_token_here
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎬 Features

### ✅ Working Dropdown Categories

**Language Categories:**
- English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Arabic

**Anime Categories:**
- Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller, Psychological, Mecha, Isekai, Shounen, Shoujo, Seinen, Josei

**Genre Categories:**
- Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Sci-Fi, Thriller, War, Western

**Year Categories:**
- 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2010s, 2000s, 1990s, 1980s, 1970s, 1960s, 1950s, Classic

**Rating Categories:**
- 9+, 8+, 7+, 6+, 5+, Top Rated, Highly Rated, Critically Acclaimed, Award Winners, Oscar Winners, Golden Globe, Cannes, Sundance, Venice, Berlin

### 🎯 Core Features
- **Real-time Search**: Find movies, TV shows, and people
- **Category Browsing**: Explore by language, genre, year, rating
- **Watchlist**: Save and manage your favorite content
- **Responsive Design**: Works on all devices
- **Beautiful Animations**: Smooth transitions and interactions
- **Infinite Scroll**: Load more content seamlessly
- **Advanced Filtering**: Sort by popularity, rating, date, title

## 🛠️ Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Headless UI** - Accessible components
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
FrontEnd/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx      # Navigation with dropdowns
│   │   ├── EnhancedLoader.jsx # Loading animations
│   │   ├── UnifiedMovieCard.jsx # Movie/TV show cards
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page
│   │   ├── ExplorePage.jsx # Category browsing
│   │   ├── DetailsPage.jsx # Movie/TV show details
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   │   └── apiUtils.js     # API integration
│   ├── services/           # API services
│   └── store/              # State management
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the FrontEnd directory:

```env
# Required: TMDB API Token
VITE_TMDB_API_TOKEN=your_actual_token_here

# Optional: Development settings
VITE_DEBUG_MODE=true
VITE_API_TIMEOUT=10000
```

### API Token Setup

1. **Get TMDB API Token:**
   - Visit [TMDB Settings](https://www.themoviedb.org/settings/api)
   - Create an account if needed
   - Request an API key (v3 auth)
   - Copy the API key (v3 auth) token

2. **Configure the token:**
   ```bash
   # Create .env file
   echo "VITE_TMDB_API_TOKEN=your_actual_token_here" > .env
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## 🐛 Troubleshooting

### Common Issues

**1. No content in dropdowns**
- ✅ **Solution**: Set up TMDB API token
- Check browser console for API errors
- Verify internet connection

**2. Empty search results**
- ✅ **Solution**: Verify API token is valid
- Check TMDB API status
- Clear browser cache

**3. Images not loading**
- ✅ **Solution**: Check TMDB API status
- Verify image URLs in browser console
- Check network connectivity

**4. Watchlist not saving**
- ✅ **Solution**: Check browser storage permissions
- Clear browser data if needed
- Verify localStorage is enabled

### Debug Mode

Enable debug logging by checking browser console for detailed API request/response information.

### API Rate Limiting

TMDB has rate limits. If you encounter rate limiting:
- Wait a few minutes before making more requests
- Consider implementing request caching
- Check your API usage in TMDB dashboard

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to Netlify

## 📱 Responsive Design

The app is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for theme changes
- Update colors in `src/index.css`
- Customize animations in component files

### Adding New Categories
1. Update `CATEGORY_MAP` in `ExplorePage.jsx`
2. Add new routes in `routes/index.jsx`
3. Update dropdown categories in `Header.jsx`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for providing the movie/TV show data API
- [Lucide](https://lucide.dev/) for the beautiful icons
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

For support or questions:
1. Check the troubleshooting section above
2. Verify API token setup
3. Check browser console for errors
4. Ensure all dependencies are installed

---

**Note**: This app requires a valid TMDB API token to display real movie and TV show data. Without a token, the app will use limited mock data for demonstration purposes.
