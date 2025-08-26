import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import ExplorePage from "../pages/ExplorePage";
import DetailsPage from "../pages/DetailsPage";
import SearchPage from "../pages/SearchPage";
import WatchlistPage from "../pages/WatchlistPage";

import CharacterPage from "../pages/CharacterPage";

import SeasonsPage from "../pages/SeasonsPage";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";

const router = createBrowserRouter([
    {
        path : "/",
        element : <App/>,
        children : [
            {
                path : "",
                element : <Home/>
            },
            {
                path : "explore/:type/:category",
                element : <ExplorePage/>
            },
            {
                path : "explore/:type/:category/:subcategory",
                element : <ExplorePage/>
            },
            {
                path : "movie/:id",
                element : <DetailsPage/>
            },
            {
                path : "tv/:id",
                element : <DetailsPage/>
            },
            {
                path : "tv/:id/season/:seasonNumber",
                element : <SeasonsPage/>
            },

            {
                path : "search",
                element : <SearchPage/>
            },
            {
                path : "watchlist",
                element : <WatchlistPage/>
            },

            {
                path : "person/:id",
                element : <CharacterPage/>
            },

            {
                path : "profile",
                element : <ProfilePage/>
            },
            {
                path : "settings",
                element : <SettingsPage/>
            },
            {
                path : "*",
                element : <Home/>
            }
        ]
    }
]);

export default router;