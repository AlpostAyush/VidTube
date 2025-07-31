import {app} from './app.js'
import dotenv from 'dotenv'
import logger from './utils/logger.js';
import CONNECTDB from './db/index.js';
 
 dotenv.config(
   {
      path : "./.env"
   }
 )


 const PORT = process.env.PORT ||  8000 ;
   
    CONNECTDB().then( ()=> { 
      app.listen(PORT , ()=>{
logger.warn(`Server is running on  ${PORT}`) ;
   }) ;
    }).catch((error)=>{
      logger.error("MONGODB connection error",error) ;
    })
    