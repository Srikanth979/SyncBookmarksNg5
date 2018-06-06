import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatToolbarModule, MatInputModule, MatProgressSpinnerModule,
    MatCardModule, MatGridListModule, MatListModule, MatIconModule, MatTableModule, MatSortModule,
    MatPaginatorModule, 
    MatTooltipModule,
    MatAutocompleteModule} from '@angular/material';
import {MatTreeModule} from '@angular/material/tree';
import {CdkTableModule} from '@angular/cdk/table';

@NgModule({
    imports:[ MatButtonModule, MatToolbarModule, MatInputModule, MatProgressSpinnerModule, MatCardModule,
        MatGridListModule, MatListModule, MatIconModule, MatTableModule, CdkTableModule, MatSortModule,
        MatPaginatorModule, MatTreeModule, MatTooltipModule, MatAutocompleteModule ],
    exports:[ MatButtonModule, MatToolbarModule, MatInputModule, MatProgressSpinnerModule, MatCardModule,
        MatGridListModule, MatListModule, MatIconModule, MatTableModule, CdkTableModule, MatSortModule,
        MatPaginatorModule, MatTreeModule, MatTooltipModule, MatAutocompleteModule ]
})
export class MaterialModule{

}