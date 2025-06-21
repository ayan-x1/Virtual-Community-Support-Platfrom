import { Component, OnDestroy, ViewChild, type OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/main/services/auth.service';
import { AdminService } from 'src/app/main/services/admin.service';
import { APP_CONFIG } from 'src/app/main/configs/environment.config';
import { HeaderComponent } from '../../header/header.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ClientService } from 'src/app/main/services/client.service';
import { Role } from 'src/app/main/enums/roles.enum';

@Component({
  selector: 'app-update-user',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent, ReactiveFormsModule, NgIf],
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css'],
})
export class UpdateUserComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];

  constructor(
    private _fb: FormBuilder,
    private _service: AuthService,
    private _adminService: AdminService,
    private _clientService: ClientService,
    private _toastr: ToastrService,
    private _activateRoute: ActivatedRoute,
    private _router: Router,
    private _toast: NgToastService
  ) {}
  
  updateForm: FormGroup;
  formValid: boolean;
  userId: string;
  updateData: any;
  isupdateProfile: boolean;
  currentLoggedInUser: any;
  headText: string = 'Update User';
  userImage: any = '';
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isImageChanged: boolean = false;
  @ViewChild('imageInput') imageInputRef: any;

  ngOnInit(): void {
    // Initialize updateForm as an empty FormGroup instance
    this.updateForm = this._fb.group({
      id: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      emailAddress: ['', [Validators.required, Validators.email]],
    });
    
    const url = this._router.url;
    if (url.includes('updateProfile')) {
      this.isupdateProfile = true;
      this.headText = 'Update Profile';
    }
    
    this.currentLoggedInUser = this._service.getUserDetail();

    // Extract user ID from route params
    this.userId = this._activateRoute.snapshot.paramMap.get('userId');
    if (this.userId && this.currentLoggedInUser) {
      const currentRole = this.currentLoggedInUser.userType;
      if (currentRole != Role.Admin) {
        if (this.userId != this.currentLoggedInUser.userId) {
          this._toast.error({
            detail: 'ERROR',
            summary: 'You are not authorized to access this page',
            duration: APP_CONFIG.toastDuration,
          });
          history.back();
        }
      }
      // Call method to fetch user data by ID
      this.fetchDetail(this.userId);
    }
  }

  passwordCompareValidator(fc: AbstractControl): ValidationErrors | null {
    return fc.get('password')?.value === fc.get('confirmPassword')?.value
      ? null
      : { notmatched: true };
  }
  
  get firstName() {
    return this.updateForm.get('firstName') as FormControl;
  }
  
  get lastName() {
    return this.updateForm.get('lastName') as FormControl;
  }
  
  get phoneNumber() {
    return this.updateForm.get('phoneNumber') as FormControl;
  }
  
  get emailAddress() {
    return this.updateForm.get('emailAddress') as FormControl;
  }

  fetchDetail(id: any) {
    const getUserSubscribe = this._clientService
      .loginUserDetailById(id)
      .subscribe((data: any) => {
        this.updateData = data.data;
        this.updateForm = this._fb.group({
          id: [this.updateData.id],
          firstName: [
            this.updateData.firstName,
            Validators.compose([Validators.required]),
          ],
          lastName: [
            this.updateData.lastName,
            Validators.compose([Validators.required]),
          ],
          phoneNumber: [
            this.updateData.phoneNumber,
            Validators.compose([
              Validators.required,
              Validators.minLength(10),
              Validators.maxLength(10),
            ]),
          ],
          emailAddress: [
            {
              value: this.updateData.emailAddress,
              disabled: this.isupdateProfile,
            },
            Validators.compose([Validators.required, Validators.email]),
          ],
          userType: [this.updateData.userType],
        });
      });
    this.unsubscribe.push(getUserSubscribe);
  }

  onSubmit() {
    this.formValid = true;
    if (this.updateForm.valid) {
      // Get raw form values (including disabled fields)
      const formData = this.updateForm.getRawValue();
      
      if (this.selectedFile) {
        // Create FormData for file upload
        const formDataToSend = new FormData();
        
        // Append form fields
        formDataToSend.append('Id', formData.id.toString());
        formDataToSend.append('FirstName', formData.firstName || '');
        formDataToSend.append('LastName', formData.lastName || '');
        formDataToSend.append('PhoneNumber', formData.phoneNumber || '');
        formDataToSend.append('EmailAddress', formData.emailAddress || '');
        formDataToSend.append('UserType', formData.userType || '');
        formDataToSend.append('IsImageChanged', 'true');
        
        // Append existing profile image path if available
        if (this.updateData?.profileImage) {
          formDataToSend.append('ExistingProfileImage', this.updateData.profileImage);
        }
        
        // Append the image file
        formDataToSend.append('ProfileImage', this.selectedFile);
        
        this.updateUserWithFormData(formDataToSend);
      } else {
        // No image selected, send regular JSON data using AuthService for profile updates
        const updateData = {
          ...formData,
          profileImage: this.updateData?.profileImage, // Keep existing image
          isImageChanged: false
        };
        
        if (this.isupdateProfile) {
          // Use AuthService for profile updates
          this.updateUserWithAuthService(updateData);
        } else {
          // Use AdminService for admin user updates
          this.updateUserWithJSON(updateData);
        }
      }
    }
    this.formValid = false;
  }

  private updateUserWithFormData(formData: FormData) {
    const updateUserSubscribe = this._adminService.updateUserWithFormData(formData).subscribe(
      (data: any) => {
        if (data.result == 1) {
          this._toast.success({
            detail: 'SUCCESS',
            summary: this.isupdateProfile 
              ? 'Profile Updated Successfully' 
              : 'User Updated Successfully',
            duration: APP_CONFIG.toastDuration,
          });
          setTimeout(() => {
            this._router.navigate([this.isupdateProfile ? 'admin/profile' : 'admin/user']);
          }, 1000);
        } else {
          this._toast.error({
            detail: 'ERROR',
            summary: data.message || 'Failed to update user',
            duration: APP_CONFIG.toastDuration,
          });
        }
      },
      (err) => {
        console.error('Update error:', err);
        this._toast.error({
          detail: 'ERROR',
          summary: err.error?.message || err.message || 'An error occurred while updating user',
          duration: APP_CONFIG.toastDuration,
        });
      }
    );
    this.unsubscribe.push(updateUserSubscribe);
  }

  private updateUserWithJSON(updateData: any) {
    const updateUserSubscribe = this._adminService.updateUserWithJSON(updateData).subscribe(
      (data: any) => {
        if (data.result == 1) {
          this._toast.success({
            detail: 'SUCCESS',
            summary: 'User Updated Successfully',
            duration: APP_CONFIG.toastDuration,
          });
          setTimeout(() => {
            this._router.navigate(['admin/user']);
          }, 1000);
        } else {
          this._toast.error({
            detail: 'ERROR',
            summary: data.message || 'Failed to update user',
            duration: APP_CONFIG.toastDuration,
          });
        }
      },
      (err) => {
        this._toast.error({
          detail: 'ERROR',
          summary: err.error?.message || err.message || 'An error occurred',
          duration: APP_CONFIG.toastDuration,
        });
      }
    );
    this.unsubscribe.push(updateUserSubscribe);
  }

  private updateUserWithAuthService(updateData: any) {
    const updateUserSubscribe = this._service.updateUser(updateData).subscribe(
      (data: any) => {
        if (data.result == 1) {
          this._toast.success({
            detail: 'SUCCESS',
            summary: 'Profile Updated Successfully',
            duration: APP_CONFIG.toastDuration,
          });
          setTimeout(() => {
            this._router.navigate(['admin/profile']);
          }, 1000);
        } else {
          this._toast.error({
            detail: 'ERROR',
            summary: data.message || 'Failed to update profile',
            duration: APP_CONFIG.toastDuration,
          });
        }
      },
      (err) => {
        this._toast.error({
          detail: 'ERROR',
          summary: err.error?.message || err.message || 'An error occurred',
          duration: APP_CONFIG.toastDuration,
        });
      }
    );
    this.unsubscribe.push(updateUserSubscribe);
  }

  onCancel() {
    if (this.isupdateProfile) {
      this._router.navigate(['admin/profile']);
    } else {
      this._router.navigateByUrl('admin/user');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this._toast.error({
          detail: 'ERROR',
          summary: 'Please select a valid image file (JPEG, PNG, GIF)',
          duration: APP_CONFIG.toastDuration,
        });
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this._toast.error({
          detail: 'ERROR',
          summary: 'File size should not exceed 5MB',
          duration: APP_CONFIG.toastDuration,
        });
        return;
      }
      
      this.selectedFile = file;
      this.isImageChanged = true;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getFullImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    // Check if imagePath already contains the base URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // For relative paths, construct the full URL
    return `${APP_CONFIG.imageBaseUrl}/${imagePath}`;
  }

  triggerImageInput(): void {
    this.imageInputRef.nativeElement.click();
  }

  cancelImageChange(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.isImageChanged = false;
    
    // Reset the file input
    if (this.imageInputRef) {
      this.imageInputRef.nativeElement.value = '';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/Images/default-user.png';
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}