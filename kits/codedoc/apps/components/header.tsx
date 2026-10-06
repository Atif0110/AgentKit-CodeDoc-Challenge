import Link from "next/link"
import Image from "next/image"
import { FileText, Github } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-neutral-200 px-6 py-4 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              CodeDoc <span className="text-neutral-400 mx-1">/</span>{" "}
              <span className="font-serif italic text-neutral-600 dark:text-neutral-400">Generator</span>
            </h1>
          </div>
        </Link>
        <div className="flex gap-4">
          <Link
            href="https://lamatic.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 transition-colors flex items-center gap-2 shadow-sm dark:bg-sky-900/30 dark:text-sky-300"
          >
            <FileText className="h-4 w-4" />
            Docs
          </Link>
          <Link
            href="https://github.com/Lamatic/AgentKit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center gap-2 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}
