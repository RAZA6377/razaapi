"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react"

export default function ApiDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className="absolute top-3 right-3 p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
      title="Copy to clipboard"
    >
      {copiedSection === section ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-purple-400" />
      )}
    </button>
  )

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app"

  const successResponse = `{
  "success": true,
  "data": {
    "shortcode": "ABC123xyz",
    "media_type": "reel",
    "original_url": "https://www.instagram.com/reel/ABC123xyz/",
    "video_url": "https://scontent.cdninstagram.com/...",
    "all_urls": [
      "https://scontent.cdninstagram.com/..."
    ],
    "thumbnail_url": "https://scontent.cdninstagram.com/...",
    "title": "Author on Instagram: Caption text...",
    "description": "Caption text with #hashtags",
    "duration_seconds": 15.5,
    "author": {
      "name": "Author Name",
      "username": "author_username",
      "profile_pic_url": "https://scontent.cdninstagram.com/..."
    },
    "engagement": {
      "likes": 12500,
      "comments": 234,
      "views": 50000
    },
    "fetched_at": "2024-01-15T10:30:00.000Z"
  }
}`

  const errorResponse = `{
  "error": "Unable to fetch media. This could be due to: Private account, Blocked access, or Content no longer available.",
  "code": "FETCH_FAILED",
  "suggestion": "Please ensure the account is public and the link is still valid."
}`

  const kotlinCode = `// Add to build.gradle (app level)
// implementation("com.squareup.okhttp3:okhttp:4.12.0")
// implementation("com.google.code.gson:gson:2.10.1")

import okhttp3.*
import com.google.gson.Gson
import java.io.IOException

data class Author(
    val name: String?,
    val username: String?,
    val profile_pic_url: String?
)

data class Engagement(
    val likes: Int?,
    val comments: Int?,
    val views: Int?
)

data class ReelData(
    val shortcode: String?,
    val media_type: String,
    val original_url: String,
    val video_url: String,
    val all_urls: List<String>,
    val thumbnail_url: String?,
    val title: String?,
    val description: String?,
    val duration_seconds: Double?,
    val author: Author,
    val engagement: Engagement,
    val fetched_at: String
)

data class ApiResponse(
    val success: Boolean,
    val data: ReelData?,
    val error: String?,
    val code: String?,
    val suggestion: String?
)

class InstagramDownloader {
    private val client = OkHttpClient()
    private val gson = Gson()
    private val baseUrl = "${baseUrl}/api/download"

    fun fetchReelInfo(
        instagramUrl: String,
        onSuccess: (ReelData) -> Unit,
        onError: (String, String?) -> Unit
    ) {
        val encodedUrl = java.net.URLEncoder.encode(instagramUrl, "UTF-8")
        val request = Request.Builder()
            .url("$baseUrl?url=$encodedUrl")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onError("Network error: \${e.message}", "NETWORK_ERROR")
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: ""
                val apiResponse = gson.fromJson(body, ApiResponse::class.java)
                
                if (apiResponse.success && apiResponse.data != null) {
                    onSuccess(apiResponse.data)
                } else {
                    onError(
                        apiResponse.error ?: "Unknown error",
                        apiResponse.code
                    )
                }
            }
        })
    }

    // Download video file
    fun downloadVideo(
        videoUrl: String,
        outputFile: java.io.File,
        onProgress: (Int) -> Unit,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        val request = Request.Builder().url(videoUrl).build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onError("Download failed: \${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body ?: return onError("Empty response")
                val contentLength = body.contentLength()
                
                outputFile.outputStream().use { output ->
                    body.byteStream().use { input ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        var totalBytesRead = 0L
                        
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalBytesRead += bytesRead
                            if (contentLength > 0) {
                                onProgress((totalBytesRead * 100 / contentLength).toInt())
                            }
                        }
                    }
                }
                onComplete()
            }
        })
    }
}`

  const javaCode = `// Add to build.gradle (app level)
// implementation 'com.squareup.okhttp3:okhttp:4.12.0'
// implementation 'com.google.code.gson:gson:2.10.1'

import okhttp3.*;
import com.google.gson.Gson;
import java.io.*;

public class InstagramDownloader {
    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();
    private final String BASE_URL = "${baseUrl}/api/download";

    public interface OnReelFetched {
        void onSuccess(ReelData data);
        void onError(String message, String code);
    }

    public void fetchReelInfo(String instagramUrl, OnReelFetched callback) {
        try {
            String encodedUrl = java.net.URLEncoder.encode(instagramUrl, "UTF-8");
            Request request = new Request.Builder()
                .url(BASE_URL + "?url=" + encodedUrl)
                .get()
                .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callback.onError("Network error: " + e.getMessage(), "NETWORK_ERROR");
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    String body = response.body() != null ? response.body().string() : "";
                    ApiResponse apiResponse = gson.fromJson(body, ApiResponse.class);
                    
                    if (apiResponse.success && apiResponse.data != null) {
                        callback.onSuccess(apiResponse.data);
                    } else {
                        callback.onError(
                            apiResponse.error != null ? apiResponse.error : "Unknown error",
                            apiResponse.code
                        );
                    }
                }
            });
        } catch (Exception e) {
            callback.onError("Error: " + e.getMessage(), "ENCODE_ERROR");
        }
    }
}

// Data classes (create separate files or use as inner classes)
class Author {
    public String name;
    public String username;
    public String profile_pic_url;
}

class Engagement {
    public Integer likes;
    public Integer comments;
    public Integer views;
}

class ReelData {
    public String shortcode;
    public String media_type;
    public String original_url;
    public String video_url;
    public String[] all_urls;
    public String thumbnail_url;
    public String title;
    public String description;
    public Double duration_seconds;
    public Author author;
    public Engagement engagement;
    public String fetched_at;
}

class ApiResponse {
    public boolean success;
    public ReelData data;
    public String error;
    public String code;
    public String suggestion;
}`

  const curlExample = `# Fetch reel information
curl -X GET "${baseUrl}/api/download?url=https://www.instagram.com/reel/ABC123xyz/"

# With URL encoding
curl -X GET "${baseUrl}/api/download?url=https%3A%2F%2Fwww.instagram.com%2Freel%2FABC123xyz%2F"`

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Downloader
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">API Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Integrate the Instagram Reel Downloader API into your Android app or any HTTP client.
          </p>
        </div>

        {/* Base URL */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Base URL</h2>
          <div className="relative">
            <code className="block p-4 rounded-xl bg-card border border-purple-500/30 text-cyan-400 font-mono text-sm overflow-x-auto">
              {baseUrl}/api/download
            </code>
            <CopyButton text={`${baseUrl}/api/download`} section="baseurl" />
          </div>
        </section>

        {/* Endpoint */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Endpoint</h2>
          <div className="p-4 rounded-xl bg-card border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold">
                GET
              </span>
              <code className="text-foreground font-mono">/api/download</code>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-purple-500/20">
                  <th className="pb-2">Parameter</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Required</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-foreground">
                  <td className="py-3 font-mono text-cyan-400">url</td>
                  <td className="py-3">string</td>
                  <td className="py-3">
                    <span className="text-red-400">Yes</span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    URL-encoded Instagram Reel, Post, or IGTV link
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* cURL Example */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">cURL Example</h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-purple-500/30 text-sm font-mono overflow-x-auto">
              <code className="text-purple-300">{curlExample}</code>
            </pre>
            <CopyButton text={curlExample} section="curl" />
          </div>
        </section>

        {/* Success Response */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Success Response (200)</h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-green-500/30 text-sm font-mono overflow-x-auto max-h-96">
              <code className="text-green-300">{successResponse}</code>
            </pre>
            <CopyButton text={successResponse} section="success" />
          </div>
        </section>

        {/* Response Fields */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Response Fields</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-purple-500/30">
              <h3 className="font-semibold text-foreground mb-3">data Object</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">shortcode</span>
                  <span className="text-muted-foreground">string | null</span>
                  <span className="text-muted-foreground">Unique post identifier</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">media_type</span>
                  <span className="text-muted-foreground">string</span>
                  <span className="text-muted-foreground">{'"reel" | "post" | "igtv" | "story"'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">video_url</span>
                  <span className="text-muted-foreground">string</span>
                  <span className="text-muted-foreground">Direct video download URL</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">thumbnail_url</span>
                  <span className="text-muted-foreground">string | null</span>
                  <span className="text-muted-foreground">Video thumbnail image</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">duration_seconds</span>
                  <span className="text-muted-foreground">number | null</span>
                  <span className="text-muted-foreground">Video duration in seconds</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2 border-b border-purple-500/10">
                  <span className="font-mono text-cyan-400">author</span>
                  <span className="text-muted-foreground">object</span>
                  <span className="text-muted-foreground">{"{ name, username, profile_pic_url }"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <span className="font-mono text-cyan-400">engagement</span>
                  <span className="text-muted-foreground">object</span>
                  <span className="text-muted-foreground">{"{ likes, comments, views }"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Response */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Error Response</h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-red-500/30 text-sm font-mono overflow-x-auto">
              <code className="text-red-300">{errorResponse}</code>
            </pre>
            <CopyButton text={errorResponse} section="error" />
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Error Codes</h2>
          <div className="p-4 rounded-xl bg-card border border-purple-500/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-purple-500/20">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">HTTP</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-purple-500/10">
                  <td className="py-3 font-mono text-red-400">MISSING_URL</td>
                  <td className="py-3">400</td>
                  <td className="py-3 text-muted-foreground">No URL parameter provided</td>
                </tr>
                <tr className="border-b border-purple-500/10">
                  <td className="py-3 font-mono text-red-400">INVALID_URL</td>
                  <td className="py-3">400</td>
                  <td className="py-3 text-muted-foreground">Not a valid Instagram URL</td>
                </tr>
                <tr className="border-b border-purple-500/10">
                  <td className="py-3 font-mono text-red-400">FETCH_FAILED</td>
                  <td className="py-3">404</td>
                  <td className="py-3 text-muted-foreground">Private account, blocked, or content unavailable</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono text-red-400">PROCESSING_ERROR</td>
                  <td className="py-3">500</td>
                  <td className="py-3 text-muted-foreground">Server-side processing error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Kotlin Example */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            Kotlin Implementation
            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">Android</span>
          </h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-purple-500/30 text-sm font-mono overflow-x-auto max-h-[500px]">
              <code className="text-purple-300">{kotlinCode}</code>
            </pre>
            <CopyButton text={kotlinCode} section="kotlin" />
          </div>
        </section>

        {/* Java Example */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            Java Implementation
            <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">Android</span>
          </h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-purple-500/30 text-sm font-mono overflow-x-auto max-h-[500px]">
              <code className="text-orange-300">{javaCode}</code>
            </pre>
            <CopyButton text={javaCode} section="java" />
          </div>
        </section>

        {/* Usage Notes */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Usage Notes</h2>
          <div className="p-4 rounded-xl bg-card border border-cyan-500/30 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">URL Encoding:</strong> Always URL-encode the Instagram link before passing it as a query parameter.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Video URLs Expire:</strong> The returned video_url is temporary. Download immediately or re-fetch when needed.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">CORS Enabled:</strong> The API supports cross-origin requests, so you can call it from any domain or app.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Rate Limiting:</strong> Be mindful of request frequency to avoid being blocked by Instagram.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Android Permissions:</strong> Add <code className="text-cyan-400">INTERNET</code> permission to your AndroidManifest.xml.
              </p>
            </div>
          </div>
        </section>

        {/* Android Manifest */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Android Manifest</h2>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-card border border-purple-500/30 text-sm font-mono overflow-x-auto">
              <code className="text-purple-300">{`<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
    android:maxSdkVersion="28" />

<!-- For Android 10+ scoped storage -->
<application
    android:requestLegacyExternalStorage="true"
    ... >`}</code>
            </pre>
            <CopyButton text={`<uses-permission android:name="android.permission.INTERNET" />\n<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />`} section="manifest" />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-purple-500/20 text-center">
          <p className="text-muted-foreground text-sm">
            Deploy this API to Vercel for production use.{" "}
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
            >
              Deploy Now <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
