"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

interface AnalysisResult {
  success: boolean
  data?: any
  error?: string
}

interface DocResult {
  success: boolean
  documentation?: string
  sections?: any
  bundleSize?: number
  error?: string
}

export async function analyzeRepository(
  repositoryUrl: string,
  branch?: string
): Promise<{
  success: boolean
  analysis?: any
  fileCount?: number
  error?: string
}> {
  try {
    const flowKey = "codedoc-clone-analyze"
    const flow = config.flows[flowKey]

    if (!flow.workflowId) {
      throw new Error("CODEDOC_CLONE_ANALYZE is not set in environment variables.")
    }

    const inputs: Record<string, any> = {
      repositoryUrl,
    }

    if (branch) {
      inputs.branch = branch
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    const analysis = resData?.result?.analysis

    if (!analysis) {
      throw new Error("No analysis result found in response")
    }

    return {
      success: true,
      analysis,
      fileCount: resData?.result?.fileCount,
    }
  } catch (error) {
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic AI. Please check your internet connection."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please verify your API credentials."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function generateDocumentation(
  repositoryUrl: string,
  analysis: any,
  sections?: string[]
): Promise<DocResult> {
  try {
    const flowKey = "codedoc-generate-docs"
    const flow = config.flows[flowKey]

    if (!flow.workflowId) {
      throw new Error("CODEDOC_GENERATE_DOCS is not set in environment variables.")
    }

    const inputs: Record<string, any> = {
      repositoryUrl,
      analysis,
    }

    if (sections) {
      inputs.sections = sections
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    const documentation = resData?.result?.documentation

    if (!documentation) {
      throw new Error("No documentation result found in response")
    }

    return {
      success: true,
      documentation,
      sections: resData?.result?.sections,
      bundleSize: resData?.result?.bundleSize,
    }
  } catch (error) {
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic AI. Please check your internet connection."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please verify your API credentials."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function generateDocsPipeline(
  repositoryUrl: string,
  branch?: string
): Promise<{
  success: boolean
  documentation?: string
  analysis?: any
  data?: any
  error?: string
}> {
  // Step 1: Analyze the repository
  const analysisResult = await analyzeRepository(repositoryUrl, branch)

  if (!analysisResult.success || !analysisResult.analysis) {
    return {
      success: false,
      error: analysisResult.error || "Failed to analyze repository",
    }
  }

  // Step 2: Generate documentation from the analysis
  const docResult = await generateDocumentation(
    repositoryUrl,
    analysisResult.analysis
  )

  if (!docResult.success) {
    return {
      success: false,
      error: docResult.error || "Failed to generate documentation",
    }
  }

  return {
    success: true,
    documentation: docResult.documentation,
    analysis: analysisResult.analysis,
    data: {
      documentation: docResult.documentation,
      sections: docResult.sections,
      bundleSize: docResult.bundleSize,
      fileCount: analysisResult.fileCount,
    },
  }
}
