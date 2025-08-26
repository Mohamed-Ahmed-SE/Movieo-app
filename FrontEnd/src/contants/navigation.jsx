import { MdHomeFilled } from "react-icons/md";
import { PiTelevisionFill } from "react-icons/pi";
import { BiSolidMoviePlay } from "react-icons/bi";
import { IoSearchOutline } from "react-icons/io5";
import { FaBookmark } from "react-icons/fa";
import { MdPlayCircleOutline } from "react-icons/md";


export const navigation = [
    {
        label : "Series",
        href : '/tv',
        icon : <PiTelevisionFill/>
    },
    {
        label : "Movies",
        href : "/movie",
        icon : <BiSolidMoviePlay/>
    }
]

export const mobileNavigation = [
    {
        label : "Home",
        href : "/",
        icon : <MdHomeFilled/>
    },

    ...navigation,
    {
        label : "Watchlist",
        href : "/watchlist",
        icon : <FaBookmark/>
    },
    {
        label : "Search",
        href : "/search",
        icon : <IoSearchOutline/>
    }
]