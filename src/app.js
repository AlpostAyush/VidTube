import express, { response } from 'express'
import logger from "./utils/logger.js";
import cors from 'cors'
 import cookieParser from 'cookie-parser';

import morgan from "morgan";
const app = express()  //  create an express app 


const morganFormat = ":method :url :status :response-time ms";  // custom formatted log configuration 

 app.use(express.json()) ;


 app.use( cors({
         origin: process.env.CORS_ORIGIN ,
         credential : true      // if need cookies/auth

      })
 ) ; 
   app.use(express.json({limit:"16kb"}))



  // common middleware (useful in almost all backends)
  
app.use(                          // morgan middleware
  morgan(morganFormat, {
    stream: {                  // data stream
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));   // logs via winston 
      },
    },
  })
); 
app.use(cookieParser()) ;
  app.use(express.urlencoded({extended:1 , limit:"16kb"})) ;

  app.use(express.static("public"))  // to configure static files 

     // import routes 
 import healthcheckRouter from './routes/healthcheck.routes.js';
 import  userRouter  from './routes/users.routes.js';
 import { errorHandler } from './middlewares/error.middlewares.js';

  // routes 
    app.use(`/api/v1/healthcheck`,  healthcheckRouter);
    app.use(`/api/v1/users`,  userRouter);
    app.use (errorHandler) ;
    
   
   
 export {app}












