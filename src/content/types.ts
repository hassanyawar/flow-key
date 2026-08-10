/** Every content file carries this header — requirements doc §6. Do not add
 * a content file without one. */
export interface WordPackHeader {
  source: string;
  license: string;
  attribution: string;
  retrievedAt: string;
}

export interface WordPack extends WordPackHeader {
  words: string[];
}
