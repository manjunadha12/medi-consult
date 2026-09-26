package com.mediconsult.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.net.http.SslError;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
import android.view.WindowManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1234;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Keep screen on and prevent sleep during calls
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
                            
        checkAndRequestPermissions();
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            java.util.List<String> permList = new java.util.ArrayList<>();
            permList.add(Manifest.permission.RECORD_AUDIO);
            permList.add(Manifest.permission.CAMERA);
            permList.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
            permList.add(Manifest.permission.ACCESS_FINE_LOCATION);
            permList.add(Manifest.permission.ACCESS_COARSE_LOCATION);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permList.add(Manifest.permission.READ_MEDIA_IMAGES);
            } else {
                permList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }

            boolean needRequest = false;
            for (String perm : permList) {
                if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                    needRequest = true;
                    break;
                }
            }

            if (needRequest) {
                ActivityCompat.requestPermissions(this, permList.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Configure WebView settings and permissions for WebRTC
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            
            // Allow Mixed Content (calling http API from https app)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // WebRTC audio/video settings
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setGeolocationEnabled(true);
            settings.setDatabaseEnabled(true);

            // Bypass self-signed SSL errors in local development
            webView.setWebViewClient(new BridgeWebViewClient(this.getBridge()) {
                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                    handler.proceed();
                }
            });

            // Inherit from BridgeWebChromeClient to preserve native file input chooser (onShowFileChooser)
            webView.setWebChromeClient(new BridgeWebChromeClient(this.getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            // Automatically grant WebRTC camera and microphone permissions to WebView
                            request.grant(request.getResources());
                        }
                    });
                }

                @Override
                public android.graphics.Bitmap getDefaultVideoPoster() {
                    return android.graphics.Bitmap.createBitmap(1, 1, android.graphics.Bitmap.Config.ARGB_8888);
                }

                @Override
                public boolean onConsoleMessage(android.webkit.ConsoleMessage cm) {
                    android.util.Log.d("MC_WEBVIEW_CONSOLE", String.format("[%s:%d] %s", cm.sourceId(), cm.lineNumber(), cm.message()));
                    return true;
                }

                @Override
                public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback callback) {
                    callback.invoke(origin, true, true);
                }

                @Override
                public void onCloseWindow(WebView window) {
                    // Overriding with an empty body to ignore the close request
                    // from JavaScript (window.close())
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            WebView webView = this.getBridge().getWebView();
            if (webView.canGoBack()) {
                webView.goBack(); // Navigate back inside the web app history
                return;
            }
        }
        if (!moveTaskToBack(true)) {
            super.onBackPressed();
        }
    }

    @Override
    public void onPause() {
        // Prevent WebView from suspending JS execution and WebSockets when minimized
        super.onPause();
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }

    @Override
    public void onStop() {
        // Keep Socket.IO background connections active when app is on home screen
        super.onStop();
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().resumeTimers();
            this.getBridge().getWebView().onResume();
        }
    }
}

