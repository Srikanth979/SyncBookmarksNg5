import { TestBed, inject } from '@angular/core/testing';

import { ErrorManagementService } from './error-management.service';

describe('ErrorManagementService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorManagementService]
    });
  });

  it('should be created', inject([ErrorManagementService], (service: ErrorManagementService) => {
    expect(service).toBeTruthy();
  }));
});
