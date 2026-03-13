package com.wedding.game

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Edge-to-Edge 설정
        enableEdgeToEdge()
        
        // 크롬 원격 디버깅 활성화 (PC 크롬 브라우저에서 inspect 가능)
        WebView.setWebContentsDebuggingEnabled(true)
        
        webView = WebView(this)
        setContentView(webView)

        // System UI 숨기기 (Full Screen)
        hideSystemUI()

        // WebView 설정
        with(webView.settings) {
            javaScriptEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            displayZoomControls = false
            builtInZoomControls = false
        }

        // WebChromeClient 설정: JS console.log를 Logcat으로 전달
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.apply {
                    val logMsg = "${message()} -- From line ${lineNumber()} of ${sourceId()}"
                    when (messageLevel()) {
                        ConsoleMessage.MessageLevel.ERROR -> Log.e("WebViewConsole", logMsg)
                        ConsoleMessage.MessageLevel.WARNING -> Log.w("WebViewConsole", logMsg)
                        else -> Log.d("WebViewConsole", logMsg)
                    }
                }
                return true
            }
        }

        // 로컬 파일 로드
        webView.webViewClient = WebViewClient()
        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun hideSystemUI() {
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        
        // Status bar와 Navigation bar 모두 숨김
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
