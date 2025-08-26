import { configureStore } from '@reduxjs/toolkit'
import movieoReducer from './movieoSlice'

const store = configureStore({
  reducer: {
    movieoData : movieoReducer
  },
})

export default store;