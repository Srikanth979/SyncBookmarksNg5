import {NestedTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, NgZone} from '@angular/core';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import { of as observableOf } from 'rxjs'; 
import { AuthService } from '../core/auth.service';
import { browser } from 'protractor';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
  title: string;
  url: string;
}

@Injectable()
export class FileDatabase {
  dataChange: BehaviorSubject<FileNode[]> = new BehaviorSubject<FileNode[]>([]);
  get data(): FileNode[] { return this.dataChange.value; }
  
  constructor(authService: AuthService) {
    authService.rtDBList.subscribe(data => {      
      this.initialize(data);      
    });    
  }

  initialize(data: any) {
    const dataFileTree = this.buildBookmarksTree(data, 0);        
    console.log(dataFileTree);
    if(data[0] == "default message"){
      dataFileTree[0].filename = "default message";
    }
    this.dataChange.next(dataFileTree);          
  }

  buildBookmarksTree(bNode: any, level: number): FileNode[]{
    let data: any[] = [];
    bNode.forEach(element => {
      let fNode = new FileNode();    
      if(Array.isArray(element)){
        if(element[0].children){
          fNode.title = element[1].deviceName + " / "+ element[1].browserName;
          fNode.children = element[0].children;        
        }
      }
      data.push(fNode);
    });
    return data;
  }
}


@Component({
  selector: 'app-tree-flat-overview-example',
  templateUrl: './tree-flat-overview-example.component.html',
  styleUrls: ['./tree-flat-overview-example.component.scss'],
  providers: [FileDatabase]
})
export class TreeFlatOverviewExampleComponent {

  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;
  loadNotchSpinner: boolean = true;
  noBookmarksSaved: boolean = false;
  env: any;

  constructor(database: FileDatabase, public authService: AuthService, public zone: NgZone) {
    this.env = environment;
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();    
    database.dataChange.subscribe(data => {
      if(data.length > 0 && data[0].children) {        
        this.noBookmarksSaved = false;
        this.nestedDataSource.data = data;
      }else if( data[0] && data[0].filename == "default message"){
        
      }else{
        this.noBookmarksSaved = true;
      }
      this.loadNotchSpinner = false; 
    });    
  }

  private _getChildren = (node: FileNode) => { return observableOf(node.children); };

  hasNestedChild = (_: number, nodeData: FileNode) => {return true};
}