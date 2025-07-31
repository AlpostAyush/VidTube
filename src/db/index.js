import mongoose from 'mongoose';
 import { DB_NAME } from '../constants.js';
 import logger from '../utils/logger.js';


  const CONNECTDB = async ()=>{
 try{
   const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) ;
   logger.info(`\n MONGODB connection Successfull 🤝  ${connectionInstance.connection.host}`) ;
 } catch(error){
     logger.error("MONGODB connection error" ,error) ;
     process.exit(1) ;  // force exit on DB connection failure
 }
  } ;


   export default CONNECTDB ;