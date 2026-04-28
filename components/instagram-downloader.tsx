'use client'

import { useState } from 'react'
import { 
  Download, 
  Music, 
  Video, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Link2,
  Sparkles,
  User,
  Heart,
  MessageCircle,
  Eye,
  Clock,
  Instagram
} from 'lucide-react'

interface ReelData {
  shortcode: string | null
  media_type: 'reel' | 'post' | 'igtv' | 'story'
  original_url: string
  video_url: string
  all_urls: string[]
  thumbnail_url?: string
  title?: string
  description?: string
  duration_seconds?: number
  author: {
    name?: string
    username?: string
    profile_pic_url?: string
  }
  engagement: {
    likes?: number
    comments?: number
    views?: number
  }
  fetched_at: string
}

interface DownloadResponse {
  success: boolean
  data: ReelData
}

interface ErrorResponse {
  error: string
  code: string
  suggestion?: string
}

export function InstagramDownloader() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorResponse | null>(null)
  const [result, setResult] = useState<DownloadResponse | null>(null)
  const [downloadingMp4, setDownloadingMp4] = useState(false)
  const [downloadingMp3, setDownloadingMp3] = useState(false)

  const fetchMedia = async () => {
    if (!url.trim()) {
      setError({ error: 'Please enter an Instagram URL', code: 'EMPTY_URL' })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data as ErrorResponse)
        return
      }

      setResult(data as DownloadResponse)
    } catch {
      setError({ 
        error: 'Network error. Please check your connection and try again.', 
        code: 'NETWORK_ERROR' 
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (type: 'mp4' | 'mp3') => {
    if (!result?.data.video_url) return

    const setDownloading = type === 'mp4' ? setDownloadingMp4 : setDownloadingMp3
    setDownloading(true)

    try {
      const response = await fetch(result.data.video_url)
      const blob = await response.blob()
      
      // Create blob with correct MIME type
      const mimeType = type === 'mp4' ? 'video/mp4' : 'audio/mpeg'
      const properBlob = new Blob([blob], { type: mimeType })
      
      const downloadUrl = URL.createObjectURL(properBlob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const filename = result.data.author.username 
        ? `instagram_${result.data.author.username}_${result.data.shortcode || Date.now()}.${type}`
        : `instagram_${result.data.media_type}_${Date.now()}.${type}`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch {
      setError({ 
        error: 'Download failed. The video URL may have expired. Try fetching again.', 
        code: 'DOWNLOAD_ERROR' 
      })
    } finally {
      setDownloading(false)
    }
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return 'N/A'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'PRIVATE_ACCOUNT':
      case 'BLOCKED_ACCESS':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-card/50 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        
        <div className="relative p-6 md:p-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 p-1 rounded-xl border border-purple-500/30 bg-background/50 focus-within:border-cyan-400/50 transition-colors">
                <div className="pl-3">
                  <Link2 className="w-5 h-5 text-purple-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMedia()}
                  placeholder="Paste Instagram Reel URL here..."
                  className="flex-1 bg-transparent py-3 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Fetch Button */}
            <button
              onClick={fetchMedia}
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl py-3.5 px-6 font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-[1px] bg-gradient-to-r from-purple-600/80 to-cyan-500/80 rounded-[10px] opacity-0 group-hover:opacity-0" />
              
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Fetching Media...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Fetch Media</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <div className="flex items-start gap-3">
                <div className="text-red-400 mt-0.5">
                  {getErrorIcon(error.code)}
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error.error}</p>
                  {error.suggestion && (
                    <p className="text-red-400/70 text-sm mt-1">{error.suggestion}</p>
                  )}
                  <span className="inline-block mt-2 text-xs text-red-400/50 font-mono">
                    Error Code: {error.code}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Success indicator */}
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Media found successfully!</span>
              </div>

              {/* Author Info Card */}
              {(result.data.author.username || result.data.author.name) && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  {result.data.author.profile_pic_url ? (
                    <img 
                      src={result.data.author.profile_pic_url} 
                      alt={result.data.author.username || 'Author'}
                      className="w-12 h-12 rounded-full border-2 border-purple-500/50 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500/50 bg-purple-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {result.data.author.name && (
                      <p className="font-medium text-foreground truncate">{result.data.author.name}</p>
                    )}
                    {result.data.author.username && (
                      <p className="text-sm text-purple-400">@{result.data.author.username}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Instagram className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-300 capitalize">{result.data.media_type}</span>
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center p-3 rounded-xl border border-purple-500/20 bg-card/30">
                  <Heart className="w-4 h-4 text-pink-400 mb-1" />
                  <span className="text-sm font-semibold text-foreground">{formatNumber(result.data.engagement.likes)}</span>
                  <span className="text-xs text-muted-foreground">Likes</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-purple-500/20 bg-card/30">
                  <MessageCircle className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-sm font-semibold text-foreground">{formatNumber(result.data.engagement.comments)}</span>
                  <span className="text-xs text-muted-foreground">Comments</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-purple-500/20 bg-card/30">
                  <Eye className="w-4 h-4 text-purple-400 mb-1" />
                  <span className="text-sm font-semibold text-foreground">{formatNumber(result.data.engagement.views)}</span>
                  <span className="text-xs text-muted-foreground">Views</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-purple-500/20 bg-card/30">
                  <Clock className="w-4 h-4 text-green-400 mb-1" />
                  <span className="text-sm font-semibold text-foreground">{formatDuration(result.data.duration_seconds)}</span>
                  <span className="text-xs text-muted-foreground">Duration</span>
                </div>
              </div>

              {/* Description */}
              {result.data.description && (
                <div className="p-3 rounded-xl border border-purple-500/20 bg-card/30">
                  <p className="text-sm text-muted-foreground line-clamp-3">{result.data.description}</p>
                </div>
              )}

              {/* Video Preview */}
              <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-black/50">
                {result.data.thumbnail_url && (
                  <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-30" 
                    style={{ backgroundImage: `url(${result.data.thumbnail_url})` }} 
                  />
                )}
                <video
                  src={result.data.video_url}
                  poster={result.data.thumbnail_url}
                  controls
                  className="relative w-full max-h-[400px] object-contain"
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MP4 Download */}
                <button
                  onClick={() => downloadFile('mp4')}
                  disabled={downloadingMp4}
                  className="relative group overflow-hidden rounded-xl py-3 px-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {downloadingMp4 ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        <span>Download MP4 (Video)</span>
                      </>
                    )}
                  </span>
                </button>

                {/* MP3 Download */}
                <button
                  onClick={() => downloadFile('mp3')}
                  disabled={downloadingMp3}
                  className="relative group overflow-hidden rounded-xl py-3 px-4 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {downloadingMp3 ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-5 h-5" />
                        <span>Download MP3 (Audio)</span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Additional info */}
              <p className="text-center text-xs text-muted-foreground">
                Shortcode: <span className="text-purple-400 font-mono">{result.data.shortcode || 'N/A'}</span>
                {' • '}
                <span className="text-cyan-400">{result.data.all_urls.length} quality option(s) available</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 p-4 rounded-xl border border-purple-500/20 bg-card/30">
        <h3 className="text-sm font-medium text-purple-400 mb-2">Tips for best results:</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use direct links from Instagram (e.g., instagram.com/reel/...)</li>
          <li>• Only public accounts can be downloaded</li>
          <li>• MP3 download extracts audio track from the video</li>
          <li>• If download fails, try fetching again as URLs expire</li>
        </ul>
      </div>
    </div>
  )
}
