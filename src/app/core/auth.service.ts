import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { AngularFireAuth } from "angularfire2/auth";
import { Observable} from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventEmitter } from 'events';
import { from } from 'rxjs';
import { AngularFireDatabase } from 'angularfire2/database';
import { Subscription } from 'rxjs/Subscription';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';


@Injectable()
export class AuthService {

  authState: firebase.User = null;
  messages: any[] = [];
  pubEve: EventEmitter = new EventEmitter();
  private rtDBSource = new BehaviorSubject<any>(["default message"]);
  private actionSource = new BehaviorSubject<any>("");
  private rtDbSnaphotSource = new BehaviorSubject<any>(["default message"]);
  rtDBList: Observable<any> = this.rtDBSource.asObservable();
  rtDbSnapshot: Observable<any> = this.rtDbSnaphotSource.asObservable();
  actionMessage: Observable<any> = this.actionSource.asObservable();
  items: Observable<any[]>;
  snapshotItems: Observable<any[]>;  
  toggleDBSub: Subscription;
  toggleDBSnapshotSub: Subscription;
  toggleDBDeviceSub: Subscription;
  dbBookmarksRef: string = '';
  dbDeviceNameRef: string = '';
  devices: Observable<any>;

  constructor(public af: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {   
    af.authState.subscribe((auth) => {
      console.log("Subscripion at Auth");
      this.authState = auth;
      if(this.authState){
        this.publishAction({action: "loginAction", payload: true });        
        this.router.navigate(['/user-profile']);
        this.dbBookmarksRef = '/users/'+this.authState.uid+'/bookmarks';
        this.dbDeviceNameRef = '/users/'+this.authState.uid+'/deviceName';
        this.items = db.list(this.dbBookmarksRef).valueChanges();   
        this.snapshotItems = db.list(this.dbBookmarksRef).snapshotChanges();
        this.devices = db.list(this.dbDeviceNameRef).valueChanges();
        this.subscribeToDB();
        this.registerListener('signingOut').subscribe((data)=>{          
          this.unSubscribeToDB();
        });
      }else{
        this.publishAction({action: "loginAction", payload: false });
        this.router.navigate(['/user-login']);        
      } 
    });        
  }

  subscribeToDB(){
    this.toggleDBSub = this.items.subscribe((data) => this.publishData(this.rtDBSource, data));
    this.toggleDBSnapshotSub = this.snapshotItems.subscribe((data) => this.publishData(this.rtDbSnaphotSource, data));
    this.toggleDBDeviceSub = this.devices.subscribe((data) => this.publishAction({action: "fetchDevicesAction", payload: data}));
  }

  unSubscribeToDB(){    
    this.toggleDBSub.unsubscribe();
    this.toggleDBSnapshotSub.unsubscribe();
    this.toggleDBDeviceSub.unsubscribe();
  }

  get authenticated(): boolean{
    return this.authState !== null;
  }

  get currentUser(): firebase.User{
    return this.authenticated? this.authState: null;
  }

  googleLogin(): Promise<any> {
    return this.socialSignIn("Google");
  }

  facebookLogin(): Promise<any> {
    return this.socialSignIn("Facebook");
  }

  twitterLogin(): Promise<any> {
    return this.socialSignIn("Twitter");
  }

  private socialSignIn(provider: string): Promise<any>{
    let authProvider: any;
    switch(provider){      
      case "Google":
        console.log('Google Auth Provider');
        authProvider = new firebase.auth.GoogleAuthProvider();
        break;
      case "Facebook":
      console.log('Fb Auth Provider');  
        authProvider = new firebase.auth.FacebookAuthProvider();
        break;
      case "Twitter":
      console.log('Twitter Auth Provider');
        authProvider = new firebase.auth.TwitterAuthProvider();
      break;
    }
    return this.af.auth.signInWithPopup(authProvider)
    .then(() => this.updateViewWithUserData())
    .catch(error => {    
      console.log(error);  
      if(error && error.message){
        this.messages = [];        
        this.messages.push(error);
      }
    });
  }

  emailSignUp(userForm: any): Promise<any> {
    return this.af.auth.createUserWithEmailAndPassword(userForm.email, userForm.password).then(() => this.updateViewWithUserData())
    .catch(error => {    
      console.log(error);  
      if(error && error.message){ 
        this.messages = [];       
        this.messages.push(error);
      }
    });
  }

  emailSignIn(userForm: any): Promise<any> {
    return this.af.auth.signInWithEmailAndPassword(userForm.email, userForm.password).then(() => this.updateViewWithUserData())
    .catch(error => {    
      console.log(error);  
      if(error && error.message){ 
        this.messages = [];       
        this.messages.push(error);
      }
    });
  }

  private updateViewWithUserData(){
    // subscribe to auth state will handle this functionality
    console.log("asdf");
  }
 
  socialSignOut(): Promise<any>{
    return this.af.auth.signOut()
    .then(() => this.updateViewWithUserData())
    .catch(error => console.log(error));
  }

  get errorMessages(){
    return this.messages;
  }

  publish(action: string, data?: any){
    this.pubEve.emit(action, data);
  }

  registerListener(action): Observable<any>{
    let asyncData: Promise<any> = new Promise((resolve, reject) => {
      this.pubEve.addListener(action, (data) => {
        resolve();
      });
    });
    return from(asyncData);
  }

  publishData(source: any, data: any){
    source.next(data);
  }

  publishAction(data: any){
    this.actionSource.next(data);
  }

  updateBookmarksInFirebase(bookmarks: any, refKey: string): Promise<void>{    
    return this.db.list(this.dbBookmarksRef).set(refKey, bookmarks);
  }

  addBookmarksInFirebase(bookmarks: any): Promise<any>{
    return new Promise((resolve, reject) => {
      this.db.list(this.dbBookmarksRef).push(bookmarks).then((ref)=>{
        resolve(ref);
      });
    });
  }

  addDeviceNameInFirebase(deviceName: string): Promise<any>{    
    return new Promise((resolve, reject) => {
      this.db.list(this.dbDeviceNameRef).push(deviceName).then((ref)=>{
        resolve(ref);
      });
    });
  }
}