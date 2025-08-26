import { useEffect, useState } from "react"
import { apiRequest } from "../utils/apiUtils"

const useFetchDetails = (endpoint)=>{
    const [data,setData] = useState()
    const [loading,setLoading] = useState(false)

    const fetchData = async()=>{
        try {
            setLoading(true)
            const response = await apiRequest(endpoint)
            
                        // Process the data to add correct media_type based on Animation genre
            const processedData = response.data ? {
              ...response.data,
              // Check if it's explicitly marked as anime
              media_type: response.data.media_type === 'anime' ? 'anime' :
                // Check ONLY for Animation genre
                response.data.genres?.some(genre => 
                  genre.name?.toLowerCase().includes('animation')
                ) ? 'anime' :
                // Also check genre_ids for animation (ID 16 is Animation)
                response.data.genre_ids?.includes(16) ? 'anime' : response.data.media_type
            } : response.data;
            
            setLoading(false)
            setData(processedData)
        } catch (error) {
            console.log('error',error)
            setLoading(false)
       }
    }

    useEffect(()=>{
        fetchData()
    },[endpoint])

    return { data , loading}
}

export default useFetchDetails