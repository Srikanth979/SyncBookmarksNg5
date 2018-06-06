import { Injectable } from '@angular/core';

@Injectable()
export class ErrorManagementService {

  constructor() { }

  formattedError(errors: Array<any>): Array<any>{
    errors.forEach(err => {
      if(err.code){
        switch (err.code){
          case "auth/invalid-email": 
            err.formattedMessage = "Invalid email address.";
            break;
          case "auth/account-exists-with-different-credential": 
            err.formattedMessage = "An account already exists with the same email address but different sign-in credentials. ";
            if(err.email.indexOf("gmail") !== -1){
              err.formattedMessage += "Sign in using a Google's sign-in provider.";
            }
            if(err.email.indexOf("facebook") !== -1){
              err.formattedMessage += "Sign in using a Facebook's sign-in provider.";
            }
            if(err.email.indexOf("twitter") !== -1){
              err.formattedMessage += "Sign in using a Twitter's sign-in provider.";
            }
            break;
        }
      }
    });    
    return errors;
  }

}
