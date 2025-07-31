class ApiError extends Error{
     constructor(statusCode,msg = "Something went Wrong", errors = [] , stack = "" ){  // stacktrace of where the errors are 
          super(msg) ;

        this.statusCode = statusCode
        this.data=null
        this.msg=msg
        this.success = 0;
        this.errors=errors
          if(stack){
            this.stack=stack 
          } else{
              Error.captureStackTrace(this,this.constructor) ;
          }
     }
}


 export {ApiError}