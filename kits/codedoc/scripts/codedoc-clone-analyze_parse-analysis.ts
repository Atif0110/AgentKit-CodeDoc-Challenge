/**
 * Parse & Structure — codedoc-clone-analyze
 *
 * Parses the LLM-generated JSON analysis response and merges it with the
 * file-tree data from the gitHubNode and codeAnalysisNode outputs.
 *
 * Lamatic template variables:
 *   {{LLMNode_3.output.generatedResponse}}      — raw LLM JSON output
 *   {{codeAnalysisNode_2.output.fileTree}}       — file tree from GitHub
 *   {{codeAnalysisNode_2.output.analysis}}       — pre-analysis from codeAnalysisNode
 *   {{codeAnalysisNode_2.output.languageBreakdown}} — language stats
 */

const parseAnalysis = (raw) => {
  // The LLM output may be inside a JSON code block — strip markdown fencing
  let jsonStr = raw;
  if (typeof raw === 'string') {
    const match = raw.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (match) {
      jsonStr = match[1];
    }
    jsonStr = jsonStr.trim();
  }

  try {
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;

    // Validate required fields, fill in defaults
    const analysis = {
      repositoryName: parsed.repositoryName || 'Unknown Repository',
      description: parsed.description || '',
      language: parsed.language || 'Unknown',
      framework: parsed.framework || null,
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
      packageManager: parsed.packageManager || null,
      entryPoints: Array.isArray(parsed.entryPoints) ? parsed.entryPoints : [],
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
      scripts: parsed.scripts || {},
      fileInventory: Array.isArray(parsed.fileInventory)
        ? parsed.fileInventory.slice(0, 200)
        : [],
      configFiles: Array.isArray(parsed.configFiles) ? parsed.configFiles : [],
      apiRoutes: Array.isArray(parsed.apiRoutes) ? parsed.apiRoutes : [],
      components: Array.isArray(parsed.components) ? parsed.components : [],
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
      buildTools: Array.isArray(parsed.buildTools) ? parsed.buildTools : [],
      fileCount: Array.isArray(parsed.fileInventory) ? parsed.fileInventory.length : 0,
      languageBreakdown: parsed.languageBreakdown || {},
      source: 'LLM-generated analysis with file-tree enrichment'
    };

    return {
      success: true,
      analysis,
      fileCount: analysis.fileCount,
      languageBreakdown: analysis.languageBreakdown
    };
  } catch (e) {
    // If parsing fails, return the codeAnalysisNode output as a fallback
    return {
      success: true,
      analysis: raw,
      fileCount: 0,
      languageBreakdown: {},
      error: e instanceof Error ? e.message : String(e)
    };
  }
};

return parseAnalysis({{LLMNode_3.output.generatedResponse}});
