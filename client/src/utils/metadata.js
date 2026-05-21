/**
 * Utility for parsing and stringifying hidden manifest metadata.
 * Uses a Markdown comment block to store JSON properties within the description.
 */

const METADATA_REGEX = /<!-- METADATA: (\{.*\}) -->/;

export const parseMetadata = (description = '') => {
  try {
    const match = description.match(METADATA_REGEX);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (err) {
    console.error('📡 METADATA_PARSER_ERROR: Failed to decrypt manifest properties', err);
  }
  return {};
};

export const stringifyMetadata = (description = '', metadata = {}) => {
  const cleanDescription = description.replace(METADATA_REGEX, '').trim();
  const metadataBlock = `<!-- METADATA: ${JSON.stringify(metadata)} -->`;
  return `${cleanDescription}\n\n${metadataBlock}`;
};

export const getDisplayDescription = (description = '') => {
  return description.replace(METADATA_REGEX, '').trim();
};
