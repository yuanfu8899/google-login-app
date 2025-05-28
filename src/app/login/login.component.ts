import {
  Component,
  signal,
  WritableSignal,
  computed,
  OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

/**
 * 解碼 JWT base64url 字串為原始 JSON 物件
 * @param jwt JWT 字串
 * @returns 解析後的 JSON 物件
 */
function parseJwt(jwt: string): any {
  try {
    // 取出 payload 部分（JWT 的第二部分）
    const base64Url = jwt.split('.')[1];
    // 將 base64url 轉為標準 base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // 補齊 = 符號
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    // 解碼 base64 為原始二進位資料
    const rawData = atob(paddedBase64);
    // 將原始資料轉為 UTF-8
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    // 使用 TextDecoder 將 UTF-8 資料轉為字串（支援中文等非 ASCII 字元）
    const decoded = new TextDecoder('utf-8').decode(outputArray);
    // 解析為 JSON 物件
    return JSON.parse(decoded);
  } catch (e) {
    console.error('解析 JWT 失敗', e);
    return null;
  }
}

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  userData: WritableSignal<any> = signal(null);
  userName = computed(() => this.userData()?.name || '');
  googleUser: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // 初始化 Google 登入按鈕
    google.accounts.id.initialize({
      client_id: '請設定Client ID', // 從 Google Cloud Console 取得的 Client ID
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' }
    );

    google.accounts.id.prompt(); // 顯示 One Tap 登入
  }
  handleCredentialResponse(response: any) {
    const idToken = response.credential;
    // 使用獨立函式解析 JWT
    const payload = parseJwt(idToken);
    this.userData.set({
      name: payload.name,
      email: payload.email,
      id: payload.sub,
    });
    this.googleUser = {
      name: payload.name,
      email: payload.email,
      id: payload.sub,
    };
    // TODO: 呼叫後端 API 驗證 idToken，尚未實作
    // this.http.post('/api/auth/google', { idToken }).subscribe(...)
  }

  googleUserName() {
    return this.googleUser ? this.googleUser.name : '';
  }

  googleUserData() {
    return this.googleUser;
  }
}
