import { Component, enableProdMode, Input, OnInit } from '@angular/core';
import * as firebase from 'firebase';
import { Observable } from 'rxjs';
import { AuthService } from './core/auth.service';
import { AngularFireAuth } from "angularfire2/auth";
import { Router, ParamMap } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  loggedIn : boolean = false;
  loadIndicator: boolean = true;
  env: any;

  constructor(public authService: AuthService, public af: AngularFireAuth, public router: Router){    
    this.env = environment;
    this.authService.actionMessage.subscribe(data => {      
      if(data.action && data.action == "loginAction"){
        this.loggedIn = data.payload;
        this.loadIndicator = false;
      }
    });
  }
  
  signOut(){
    this.authService.publish("signingOut");
    this.router.navigate(['/user-login']);     
    this.authService.socialSignOut().then(() => this.afterSignOut());    
  }

  private afterSignOut(): any{
    console.log("Signed Out");
  }

  ngOnInit(){}
  
}
