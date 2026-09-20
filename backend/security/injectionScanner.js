const INJECTION_PATTERNS = [
    /ignore (all |previous |prior )?instructions/i,
    /you are now/i,
    /system\s*:/i,
    /disregard (the )?(above|previous)/i,
    /reveal (your |the )?(system prompt|instructions)/i,
  ];
  
  function scanForInjection(text) {
    if (!text) return { suspicious: false, matches: [] };
  
    const matches = INJECTION_PATTERNS
      .filter((pattern) => pattern.test(text))
      .map((pattern) => pattern.source);
  
    return { suspicious: matches.length > 0, matches };
  }
  
  module.exports = { scanForInjection };