"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, FileText, Copy, Check, Download, Github } from "lucide-react"
import { generateDocsPipeline } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import { Header } from "@/components/header"

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [docs, setDocs] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isValidGithubUrl = (url: string) => {
    return url.includes("github.com/") && (url.startsWith("https://") || url.startsWith("http://"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    if (!isValidGithubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)")
      return
    }

    setIsLoading(true)
    setIsAnalyzing(true)
    setError(null)
    setDocs(null)
    setAnalysis(null)
    setCopied(false)

    try {
      const response = await generateDocsPipeline(repoUrl)

      if (response.success && response.data) {
        setDocs(response.data.documentation || response.documentation || null)
        setAnalysis(response.data.analysis || analysis || null)
        setIsAnalyzing(false)
      } else {
        setError(response.error || "Failed to generate documentation")
        setIsAnalyzing(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsAnalyzing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setDocs(null)
    setAnalysis(null)
    setError(null)
    setRepoUrl("")
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!docs) return
    try {
      await navigator.clipboard.writeText(docs)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const handleDownload = () => {
    if (!docs) return
    const blob = new Blob([docs], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "CODEDOC-generated-docs.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!docs && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lamatic AgentKit Challenge</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                CodeDoc Generator
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Turn any GitHub repository into comprehensive documentation. Paste a repo URL and get a README, API reference, architecture overview, and deployment guide — all in seconds.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto mb-8">
              <CardHeader>
                <CardTitle>Repository URL</CardTitle>
                <CardDescription>
                  Enter a public GitHub repository URL (e.g. https://github.com/lamatic/AgentKit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Github className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <Input
                      type="url"
                      placeholder="https://github.com/owner/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="flex-1"
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isAnalyzing}
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing repository...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Documentation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {isAnalyzing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cloning repository and analyzing code structure...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {docs && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Generated Documentation</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-2">{copied ? "Copied!" : "Copy"}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  <span className="ml-2">Download</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  New Repo
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold my-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-semibold my-2" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-lg font-medium my-2" {...props} />,
                    p: ({ node, ...props }) => <p className="my-3" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside my-3 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-3 space-y-1" {...props} />,
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <code className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-sm" {...props} />
                      ) : (
                        <pre className="bg-neutral-100 dark:bg-neutral-900 rounded p-4 overflow-x-auto my-3">
                          <code {...props} />
                        </pre>
                      ),
                    a: ({ node, ...props }) => (
                      <a className="text-indigo-600 dark:text-indigo-400 underline" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="border-collapse border border-neutral-300 dark:border-neutral-700 w-full" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-left" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2" {...props} />
                    ),
                  }}
                >
                  {docs}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
