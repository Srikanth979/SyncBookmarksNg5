import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import * as firebase from 'firebase';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { ErrorManagementService } from '../../core/error-management.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent implements OnInit {
  
  strongPasswordRegExp:string = "^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}$";  
  email = new FormControl('', [Validators.required, Validators.email]);  
  password = new FormControl('', [Validators.required, Validators.minLength(8)]); 
  confirmPassword = new FormControl('', [Validators.required, Validators.minLength(8)]);
  hide:boolean = true;  
  userForm: FormGroup;
  displayName:string =  '';  
  authState: firebase.User;
  messages: Array<any> = [];
  form: any = {};
  registerNow: boolean = false;
  appAsExtn: boolean = environment.appAsExtn;
  loadIndicator: boolean = true;

  constructor(fb: FormBuilder, public authService: AuthService, public af: AngularFireAuth, 
    public errorService: ErrorManagementService) {
    this.userForm = fb.group({
      email: this.email,
      password: this.password
    });    
    
  }

  getErrorMessage() {
    return this.email.hasError('required') ? 'You must enter a value' :
        this.email.hasError('email') ? 'Not a valid email' :
            '';
  }

  getMinLengthErrorMessage(){
    return this.password.hasError('required') ? 'You must enter a value' :
        this.password.hasError('minlength') ? 'Password must be atleast 8 characters long' :        
            '';
  }  

  signUpWithEmail(){
    if(this.form.email !== "" && this.form.password != ""){
      this.authService.emailSignUp(this.form).then(() => this.afterSignIn());
    }
  }

  signInWithEmail(){
    this.buildFormItem();    
    if(this.form.email !== "" && this.form.password != ""){
      this.authService.emailSignIn(this.form).then(() => this.afterSignIn());
    }
  }

  userFormSubmit(formValidity){
    if(formValidity === true){
      if(this.registerNow){
        this.signUpWithEmail();
      }else{
        this.signInWithEmail();
      }
    }
  }

  private afterSignIn(): any{
    console.log("After Signed In");
    this.messages = [];
    this.errorService.formattedError(this.authService.errorMessages).forEach(err =>{
      if(err.formattedMessage){
        this.messages.push(err.formattedMessage);  
      }else{
        this.messages.push(err.message);
      }      
    });
    if(this.authService.errorMessages.length === 0){
      this.messages = [];
    }
  }

  signInWithGoogle(): void{
    this.authService.googleLogin().then(() => this.afterSignIn());
  }

  signInWithFacebook(): void{
    this.authService.facebookLogin().then(() => this.afterSignIn());
  }
  
  signInWithTwitter(): void{
    this.authService.twitterLogin().then(() => this.afterSignIn());
  }

  signOut(): void {
    this.authService.socialSignOut().then(() => this.afterSignOut());
  }

  private afterSignOut(): any{
    console.log("Signed Out");
  }

  private buildFormItem(){    
    this.form = {
      email: this.userForm.get('email').value,
      password: this.userForm.get('password').value
    };
    if(this.registerNow){
      this.form.confirmPassword = this.userForm.get('confirmPassword').value;
    }else{
      delete this.form.confirmPassword;
    }
  }

  checkPasswords(){
    if(this.registerNow){      
      this.buildFormItem();
      this.messages = [];
      if(this.form.password !== this.form.confirmPassword){
        if(this.userForm.controls.password.dirty && this.userForm.controls.confirmPassword.dirty){
          this.messages.push("Passwords entered doesn't match. Please re-submit after entering same passwords below.");
        }
      }
    }
  }

  ngOnInit() {
  }

}
