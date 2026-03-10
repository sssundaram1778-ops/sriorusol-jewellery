package com.suss.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.JavascriptInterface;
import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.util.Base64;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Setup JavaScript interface for PDF download after bridge is ready
        new android.os.Handler(getMainLooper()).postDelayed(() -> {
            try {
                WebView webView = getBridge().getWebView();
                
                // Add JavaScript interface for handling base64 PDF downloads
                webView.addJavascriptInterface(new PdfDownloadInterface(this), "AndroidPdfDownloader");
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 1000);
    }
    
    // JavaScript interface class for PDF downloads
    public class PdfDownloadInterface {
        private Context context;
        
        public PdfDownloadInterface(Context context) {
            this.context = context;
        }
        
        @JavascriptInterface
        public void downloadPdf(String base64Data, String filename) {
            try {
                // Remove data URI prefix if present
                String cleanBase64 = base64Data;
                if (base64Data.contains(",")) {
                    cleanBase64 = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                
                // Decode base64 to bytes
                byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                
                // Save to Downloads folder
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                
                File pdfFile = new File(downloadsDir, filename);
                
                FileOutputStream fos = new FileOutputStream(pdfFile);
                fos.write(pdfBytes);
                fos.flush();
                fos.close();
                
                // Show success toast on UI thread
                runOnUiThread(() -> {
                    Toast.makeText(context, "PDF saved to Downloads: " + filename, Toast.LENGTH_LONG).show();
                });
                
            } catch (Exception e) {
                e.printStackTrace();
                final String errorMsg = e.getMessage();
                runOnUiThread(() -> {
                    Toast.makeText(context, "Error saving PDF: " + errorMsg, Toast.LENGTH_LONG).show();
                });
            }
        }
    }
}
