import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import * as firebase from 'firebase';
import { Observable } from 'rxjs-compat/Observable';
import { AuthService } from '../../core/auth.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { ErrorManagementService } from '../../core/error-management.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { element } from 'protractor';
import { environment } from '../../../environments/environment';

declare var chrome;

@Component({
	selector: 'app-user-profile',
	templateUrl: './user-profile.component.html',
	styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, AfterViewInit {

	currentUser: firebase.User = null;
	displayName: string = '';
	displayedColumns = ['device', 'browser', 'location', 'title', 'url'];
	element_data: any[] = [];
	appAsExtn: boolean = environment.appAsExtn;
	refKey: string = '';
	oldRefKey: string = '';
	deviceName: string = '';
	oldRefKeyIndex: number = -1;
	deviceNameControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
	fbArrSnapshot: any[] = [];
	fbArrList: any[] = [];
	panelMessage: string = '';
	devices: string[] = [];

	BookmarkObj = function (parentId, index, title, url): void {
		this.parentId = parentId;
		this.index = index;
		this.title = title;
		this.url = url;
	}
	BookmarkObjWithoutIndex = function (parentId, title): void {
		this.parentId = parentId;
		this.title = title;
	}
	BookmarkObjWithURLWithoutIndex = function (parentId, title, url): void {
		this.parentId = parentId;
		this.title = title;
		this.url = url;
	}
	nameIndices = {
		crossBrowserIndex: 0,
		deviceNameIndex: 0,
		browserNameIndex: 0
	};
	msEdgeFavFolder = {
		id: ''
	}
	cbFolderRoot = {
		children: []
	};
	browserNameOrigin = (function () {
		let ua = navigator.userAgent, tem,
			M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if (/trident/i.test(M[1])) {
			tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
			return { name: 'IE', version: (tem[1] || '') };
		}
		if (M[1] === 'Chrome') {
			tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
			if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
		}
		M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
		if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
		return { name: M[0], version: M[1] };
	})().name;	

	recursionCounter: number = 0;
	importTaskCmpltd: boolean = false;	
	exportTaskCmpltd: boolean = false;
	importTaskInProgress: boolean = false;
	exportTaskInProgress: boolean = false;

	constructor(public authService: AuthService, public af: AngularFireAuth, public errorService: ErrorManagementService,
		public router: Router, public changeDetecRef: ChangeDetectorRef, public zone: NgZone) {
		this.currentUser = authService.currentUser;
		if (this.currentUser) {
			this.displayName = this.currentUser.displayName;
		}
		this.fetchLocalStorageItems();
		this.authService.rtDbSnapshot.subscribe(snapshotData => this.fbArrSnapshot = snapshotData);
		this.authService.rtDBList.subscribe(listData => this.fbArrList = listData); 
		this.authService.actionMessage.subscribe(devicesDataAction => {
			if(devicesDataAction.action === 'fetchDevicesAction'){
				this.devices = devicesDataAction.payload;
			}
		});
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
	}

	export(): void {
		if(chrome){			
			this.exportTaskInProgress = true;
			this.exportTaskCmpltd = false;
			this.pushPanelMessage("");			
			chrome.bookmarks.getTree((bookmarkTreeNodes) =>{
				this.initiateApp(bookmarkTreeNodes, "export");
			});
			let comp = this;		
			chrome.storage.local.set({ "deviceName": comp.deviceName.toLowerCase() }, function () {
				console.log("deviceName data saved: " + comp.deviceName);
			});
		}
	}

	import(): void {
		if(chrome){
			this.importTaskInProgress = true;
			chrome.bookmarks.getTree((bookmarkTreeNodes) =>{
				this.initiateApp(bookmarkTreeNodes, "import");
			});
		}
	}

	initiateApp(bookmarks, action) {
		bookmarks[1] = {
			'browserName': this.browserNameOrigin,
			'deviceName': this.deviceName.toLowerCase()
		};
		this.removeCrossBrowserFolder(bookmarks);  // remove cross browser folder before uploading and find the folder for Importing
		if (this.browserNameOrigin === 'Edge') {
			this.fetchEdgeFavoritesFolderIndex(bookmarks);
		}
		if (this.appAsExtn) {
			if(this.fbArrSnapshot.length > 0 && this.fbArrList.length > 0){
				this.findSameBrowserAndDeviceFolderInFirebaseList(this.fbArrSnapshot, this.fbArrList, this.refKey);
				if (action == "import") {
					this.iterateFBaseList(this.fbArrList, this.oldRefKeyIndex, bookmarks);
				}
				if(action == "export"){
					if (this.oldRefKeyIndex > -1) {
						this.saveBookmarksIntoExistingFirebase(bookmarks, this.refKey);
					} else {
						this.addBookmarksIntoFirebase(bookmarks);
					}
				}				
			}else{
				if(action == "export"){
					this.addBookmarksIntoFirebase(bookmarks);
				}else if(action == "import"){
					this.pushPanelMessage("importEmpty");
				}
			}
			if(action == "export"){
				let deviceAlreadyExists: boolean = false;
				for(let i=0; i < this.devices.length; i++){
					if(this.devices[i] == this.deviceName){
						deviceAlreadyExists = true;
						break;
					} 
				}
				if(!deviceAlreadyExists && this.deviceName != ''){
					this.authService.addDeviceNameInFirebase(this.deviceName);
				}				
			}		
		}
	}

	removeCrossBrowserFolder(bookmarkNode) {
		if (bookmarkNode.children) {
			for (var key in bookmarkNode) {  // remove undefined props before uploading
				if (bookmarkNode.hasOwnProperty(key)) {
					if (bookmarkNode[key] === undefined) {
						bookmarkNode[key] = '';
					}
				}
			}
			this.removeCrossBrowserFolder(bookmarkNode.children);
		} else {
			if (Array.isArray(bookmarkNode)) {
				for (var i = 0; i < bookmarkNode.length; i++) {
					if (bookmarkNode[i].children && bookmarkNode[i].title === 'CrossBrowser_Bookmarks') {
						this.nameIndices.crossBrowserIndex = bookmarkNode[i].id;
						bookmarkNode.splice(i, 1);
					}
					this.removeCrossBrowserFolder(bookmarkNode[i]);
				}
			}
		}
	}

	fetchEdgeFavoritesFolderIndex(bookmarkNode) {
		if (bookmarkNode.children) {
			if (bookmarkNode.title === 'Favorites') {
				this.msEdgeFavFolder.id = bookmarkNode.id;
				return;
			}
			this.fetchEdgeFavoritesFolderIndex(bookmarkNode.children);
		} else {
			if (Array.isArray(bookmarkNode)) {
				for (var i = 0; i < bookmarkNode.length; i++) {
					if (bookmarkNode[i].children && bookmarkNode[i].title === 'Favorites') {
						this.msEdgeFavFolder.id = bookmarkNode[i].id;
						break;
					}
					this.fetchEdgeFavoritesFolderIndex(bookmarkNode[i]);
				}
			}
		}
	}

	findSameBrowserAndDeviceFolderInFirebaseList(fbArrSnapshot, fbArrList, refKeyLocal) {
		this.oldRefKeyIndex = -1;
		if (refKeyLocal && refKeyLocal != '') {
			for (var i = 0; i < fbArrList.length; i++) {
				if (fbArrSnapshot[i].key === refKeyLocal) {
					this.refKey = refKeyLocal;
					this.oldRefKeyIndex = i;
					break;
				}
			}
		}
		if(this.oldRefKeyIndex === -1){
			for (var j = 0; j < fbArrList.length; j++) {
				if (fbArrList[j][1].deviceName === this.deviceName && fbArrList[j][1].browserName === this.browserNameOrigin) {
					this.oldRefKey = fbArrSnapshot[j].key;
					this.refKey = this.oldRefKey;
					this.oldRefKeyIndex = j;
					break;
				}
			}
		}
	}

	iterateFBaseList(fbArrList, matchingIndex, bookmarks) {
		if (fbArrList.length > 0) {
			let comp = this;
			comp.handleInitCBFolderOnBrowser().then(function () {
				if (fbArrList && Array.isArray(fbArrList) && fbArrList.length > 0) {
					for (var i = 0; i < fbArrList.length; i++) {
						if (fbArrList[i]) {
							if (i === matchingIndex) {
								console.log("Bookmarks from Current browser");
							} else {
								comp.buildCBFolderRoot(fbArrList[i][0], fbArrList[i][1].deviceName, fbArrList[i][1].browserName, i, bookmarks);
							}
						}
					}
				}
				comp.writeBookmarks();
			});
		}
	}

	handleInitCBFolderOnBrowser() {
		return new Promise((resolve, reject) => {
			var folderLocation = "1";
			if (this.browserNameOrigin === 'Firefox') {
				folderLocation = "toolbar_____";
			} else if (this.browserNameOrigin === 'Edge') {
				folderLocation = this.msEdgeFavFolder.id;
			}
			// create CrossBrowser_Bookmarks folder
			//cbFolderRoot.parentId = folderLocation;
			this.cbFolderRoot.children = [];
			let comp = this;
			if (comp.nameIndices.crossBrowserIndex === 0) {
				chrome.bookmarks.create(new comp.BookmarkObj(folderLocation, 0, "CrossBrowser_Bookmarks", null), function (result) {
					if (result) {
						comp.nameIndices.crossBrowserIndex = result.id;
					}
					resolve();
				});
			} else {
				try {
					chrome.bookmarks.removeTree(comp.nameIndices.crossBrowserIndex, function () {
						chrome.bookmarks.create(new comp.BookmarkObj(folderLocation, 0, "CrossBrowser_Bookmarks", null), function (result) {
							if (result) {
								comp.nameIndices.crossBrowserIndex = result.id;
							}
							resolve();
						});
					});
				} catch (e) {
					reject();
				}
			}
		});
	}

	buildCBFolderRoot(bookmarksObjectFB, deviceName, browserName, index, bookmarks) {
		console.log("build CB Folder Root: " + deviceName + " : " + browserName + " : " + index);
		if (this.nameIndices.crossBrowserIndex !== 0) {
			if (!(deviceName === this.deviceName && browserName === this.browserNameOrigin)) {
				this.nameIndices.deviceNameIndex = -1;
				for (var i = 0; i < this.cbFolderRoot.children.length; i++) {
					if (this.cbFolderRoot.children[i].title && this.cbFolderRoot.children[i].title === deviceName) {
						this.nameIndices.deviceNameIndex = i;
					}
				}
				if (this.nameIndices.deviceNameIndex === -1) {
					var browserNameFolderRoot = [{ "title": browserName, "children": bookmarksObjectFB.children }];
					var deviceNameFolderRoot = { "title": deviceName, "children": browserNameFolderRoot };
					this.cbFolderRoot.children.push(deviceNameFolderRoot);
				} else {
					var browserNameFolderRoot = [{ "title": browserName, "children": bookmarksObjectFB.children }];
					this.cbFolderRoot.children[this.nameIndices.deviceNameIndex].children.push(browserNameFolderRoot);
				}
			}
		}
	}

	saveBookmarksIntoExistingFirebase(bookmarks, refKey) {
		console.log("Before saving");		
		this.authService.updateBookmarksInFirebase(bookmarks, refKey).then((): void => {
			console.log("save successful");
			this.exportTaskCmpltd = true;
			this.exportTaskInProgress = false;
			this.pushPanelMessage("export");
			this.zone.run(() => this.exportTaskInProgress = false);
			if(chrome){
				let comp = this;			
				chrome.storage.local.set({ "bookmarksRefKey": comp.refKey }, function () {
					console.log("refKey data saved in Add Bookmarks into Firebase: " + comp.refKey);
				});
			}	
		});
	}
	addBookmarksIntoFirebase(bookmarks) {		
		console.log("Before Adding");		
		if (bookmarks[1].deviceName !== '') {
			this.authService.addBookmarksInFirebase(bookmarks).then((ref) => {
				this.refKey = ref.key;
				if(chrome){
					let comp = this;
					chrome.storage.local.set({ "bookmarksRefKey": comp.refKey }, function () {
						console.log("refKey data saved in Add Bookmarks into Firebase: " + comp.refKey);
					});
				}
				this.exportTaskCmpltd = true;					
				this.exportTaskInProgress = false;
				this.pushPanelMessage("export");
			});
		}
	}

	writeBookmarks(){
        if(this.cbFolderRoot.children.length > 0){
			this.importTaskCmpltd = false;
			this.pushPanelMessage("");
			this.recursionCounter = 0;                            
            this.traverseBookmarks(this.cbFolderRoot.children, this.nameIndices.crossBrowserIndex);                        
        }
    }

	traverseBookmarks(bookmarkNode, parentId) {
		let comp = this;
		comp.recursionCounter++; 		
        if (bookmarkNode.children) {
            if (bookmarkNode.type && bookmarkNode.type === 'folder') {
                var bookmarkObj = new comp.BookmarkObjWithoutIndex(parentId, bookmarkNode.title);
                chrome.bookmarks.create(bookmarkObj, function (result) {
                    console.log("after bookmarks Firefox's Folder creation");
                   // console.log("Folder index:" + bookmarkNode.index);
                    if (result) {
						comp.traverseBookmarks(bookmarkNode.children, result.id);
						if(--comp.recursionCounter == 0){
							comp.importTaskCmpltd = true;
						}
                    }
                });
            } else {
                var bookmarkObj = new comp.BookmarkObjWithURLWithoutIndex(parentId, bookmarkNode.title, null);
                chrome.bookmarks.create(bookmarkObj, function (result) {
                    console.log("after bookmarks Folder creation");
                  //  console.log("Folder index:" + bookmarkNode.index);
                    if (result) {
						comp.traverseBookmarks(bookmarkNode.children, result.id);
						if(--comp.recursionCounter == 0){
							comp.importTaskCmpltd = true;
						}
                    }
                });
            }
        } else {
            if (Array.isArray(bookmarkNode)) {
                for (var i = 0; i < bookmarkNode.length; i++) {
					comp.traverseBookmarks(bookmarkNode[i], parentId);
					if(--comp.recursionCounter == 0){
						comp.importTaskCmpltd = true;
					}
                }
            } else {
                if (bookmarkNode && bookmarkNode.type && bookmarkNode.type === 'folder') {
                    var bookmarkObj = new comp.BookmarkObjWithoutIndex(parentId, bookmarkNode.title);
                    chrome.bookmarks.create(bookmarkObj, function (result) {
						console.log("after bookmarks Firefox's Empty Folder creation");
						if(--comp.recursionCounter == 0){
							comp.importTaskCmpltd = true;
						}
                    });
                } else {
                    var bookmarkObj = new comp.BookmarkObjWithURLWithoutIndex(parentId, bookmarkNode.title, bookmarkNode.url);
                    chrome.bookmarks.create(bookmarkObj, function (result) {
						console.log("after bookmark creation");
						if(--comp.recursionCounter == 0){
							comp.importTaskCmpltd = true;
							comp.importTaskInProgress = false;
							comp.pushPanelMessage("import");
						}                        
                    });
                }
            }
		}		
	}
	
	setDeviceName(){
		if(this.deviceNameControl && this.deviceNameControl.value && this.deviceNameControl.value != ""){
			this.deviceName = this.deviceNameControl.value;		
			this.deviceNameControl.setValue(this.deviceName.toLowerCase());			
		}
	}

	fetchLocalStorageItems(): void{
		if(chrome && this.appAsExtn && chrome.storage) {
			let comp = this;
			chrome.storage.local.get(["deviceName", "bookmarksRefKey"], function (items) {
				console.log("deviceName, bookmarksRefKey, bookmarksRef retrieved at deviceName top");
				console.log(items);
				if(items.deviceName){
					comp.deviceName = items.deviceName;
					comp.deviceNameControl.setValue(comp.deviceName);	
				}
				if(items.bookmarksRefKey){
					comp.refKey = items.bookmarksRefKey;
				}				
			});
		}
	}

	pushPanelMessage(action){
		this.panelMessage = '';
		if(action === "import"){
			this.panelMessage = "Bookmarks in your account are imported sucessfully.";
		}else if(action === "export"){
			this.panelMessage = "Bookmarks in the current browser are exported sucessfully to your Account.";
		}else if(action === "importEmpty"){
			this.panelMessage = ""
		}
	}
	
	getMaxLengthErrorMessage(){
		return this.deviceNameControl.hasError('required') ? 'You must enter a value' :
			this.deviceNameControl.hasError('maxlength') ? 'Maximum 50 characters are allowed.' : '';
	}  
	
}


