// Rolldown can emit an import-only chunk with no map when all of its module
// code was moved elsewhere. Do not manufacture maps for executable app code.
export function generatedWrapperMap(chunk) {
  if (
    chunk.type !== "chunk" ||
    chunk.map ||
    !chunk.fileName.endsWith(".js") ||
    !Object.values(chunk.modules).every((module) => module.renderedLength === 0)
  )
    return null;
  const match = chunk.code.match(
    /^\(function\(\)\{try\{var e=typeof globalThis<`u`\?globalThis:typeof window<`u`\?window:typeof global<`u`\?global:typeof self<`u`\?self:\{\},t=new e\.Error\(\)\.stack;t&&\(e\._sentryDebugIds=e\._sentryDebugIds\|\|\{\},e\._sentryDebugIds\[t\]=`([a-f0-9-]{36})`,e\._sentryDebugIdIdentifier=`sentry-dbid-\1`\)\}catch\{\}\}\)\(\);(?:import"\.\/[^"\n]+";)+$/,
  );
  if (!match) return null;
  return {
    version: 3,
    sources: [],
    names: [],
    mappings: "",
    debug_id: match[1],
  };
}
