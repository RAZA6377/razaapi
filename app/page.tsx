import { InstagramDownloader } from '@/components/instagram-downloader'
import { Instagram, Zap, Shield, Download, Code } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(oklch(0.7 0.2 285) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.2 285) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="pt-12 pb-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-6 neon-glow-purple">
              <Instagram className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent text-glow-purple">
                Instagram Reel
              </span>
              <br />
              <span className="text-foreground">Downloader</span>
            </h1>
            
            <p className="text-muted-foreground max-w-md mx-auto text-pretty">
              Download Instagram Reels, Posts, and IGTV videos in high quality. 
              Fast, free, and no watermarks.
            </p>
            
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm"
            >
              <Code className="w-4 h-4" />
              API Documentation
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <section className="px-4 pb-12">
          <InstagramDownloader />
        </section>

        {/* Features */}
        <section className="px-4 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<Zap className="w-5 h-5" />}
                title="Lightning Fast"
                description="Instant video extraction with progressive streams"
              />
              <FeatureCard 
                icon={<Shield className="w-5 h-5" />}
                title="Bypass Protection"
                description="Works with Instagram&apos;s anti-bot measures"
              />
              <FeatureCard 
                icon={<Download className="w-5 h-5" />}
                title="Multiple Formats"
                description="Download as MP4 video or MP3 audio"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 border-t border-border/50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              This tool is for personal use only. Please respect content creators&apos; rights 
              and Instagram&apos;s terms of service.
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="p-4 rounded-xl border border-purple-500/20 bg-card/30 hover:bg-card/50 transition-colors">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
