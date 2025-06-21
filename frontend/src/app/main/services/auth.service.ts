import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { APP_CONFIG } from '../configs/environment.config';
import { User } from '../interfaces/user.interface';
import { API_ENDPOINTS } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl = APP_CONFIG.apiBaseUrl;
  imageUrl = APP_CONFIG.imageBaseUrl;

  currentUser: BehaviorSubject<any> = new BehaviorSubject(null);
  currentUserName: BehaviorSubject<any> = new BehaviorSubject(null);
  currentUserData: any;
  public userPayLoad: any;
  jwthelperService = new JwtHelperService();

  constructor(public http: HttpClient) {
    this.userPayLoad = this.decodedToken();
  }

  registerUser(user: User) {
    console.log(`${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`);
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
      user,
      { responseType: 'json' }
    );
  }

  getUserById(id: number): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.GET_USER_BY_ID}/${id}`
    );
  }

  // Original method for updating user without image
  updateUser(data: any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.UPDATE_USER}`,
      data,
      { headers }
    );
  }

  // New method for updating user with image (using FormData)
  updateUserWithImage(formData: FormData) {
    // Don't set Content-Type header - let the browser set it automatically for FormData
    // This is important for multipart/form-data to work correctly with boundary
    return this.http.put(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.UPDATE_USER}`,
      formData
    );
  }

  // Enhanced method for updating user profile with optional image
  updateUserProfile(data: any, imageFile?: File) {
    if (imageFile) {
      const formData = new FormData();
      
      // Append all user data (handle nested objects properly)
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Append image file
      formData.append('profileImage', imageFile);
      formData.append('isImageChanged', 'true');
      
      return this.http.put(
        `${this.apiUrl}${API_ENDPOINTS.AUTH.UPDATE_USER}`,
        formData
      );
    } else {
      // No image, send as JSON
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      return this.http.put(
        `${this.apiUrl}${API_ENDPOINTS.AUTH.UPDATE_USER}`,
        data,
        { headers }
      );
    }
  }

  // Method to upload profile image separately (if backend supports separate image upload)
  uploadProfileImage(userId: string, imageFile: File) {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('profileImage', imageFile);
    
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.UPLOAD_PROFILE_IMAGE}`,
      formData
    );
  }

  // Method to get user profile with updated image
  getUserProfile(userId: string) {
    return this.http.get(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.GET_USER_PROFILE}/${userId}`
    );
  }

  loginUser(loginInfo: Array<string>) {
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      {
        EmailAddress: loginInfo[0],
        Password: loginInfo[1],
      },
      { responseType: 'json' }
    );
  }

  forgotPasswordEmailCheck(data: any) {
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
      data
    );
  }

  resetPassword(data: any) {
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`,
      data,
      { responseType: 'text' }
    );
  }

  changePassword(data: any) {
    return this.http.post(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`,
      data
    );
  }

  getToken() {
    return localStorage.getItem('access_Token');
  }

  setToken(token: string) {
    localStorage.setItem('access_Token', token);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('access_Token') ? true : false;
  }

  loggedOut() {
    localStorage.removeItem('access_Token');
  }

  public getCurrentUser() {
    return this.currentUser.asObservable();
  }

  public setCurrentUser(userDetail: any) {
    return this.currentUser.next(userDetail);
  }

  decodedToken() {
    const token = this.getToken();
    return this.jwthelperService.decodeToken(token);
  }

  getUserFullName() {
    if (this.userPayLoad) return this.userPayLoad.fullName;
  }

  public getUserDetail() {
    if (this.userPayLoad) return this.userPayLoad;
  }
}