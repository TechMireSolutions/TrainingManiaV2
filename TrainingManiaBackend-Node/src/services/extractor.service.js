import fs from 'fs';
import pdf from 'pdf-parse';
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extracts plain text from a PDF file path or buffer
 * @param {string|Buffer} pdfInput - File path or buffer
 * @returns {Promise<string|null>}
 */
export async function extractTextFromPdf(pdfInput) {
  try {
    let dataBuffer;
    if (Buffer.isBuffer(pdfInput)) {
      dataBuffer = pdfInput;
    } else if (typeof pdfInput === 'string') {
      dataBuffer = fs.readFileSync(pdfInput);
    } else {
      return null;
    }

    const data = await pdf(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('[ExtractorService] Error extracting PDF text:', error.message);
    return null;
  }
}

/**
 * Extracts transcript text from a YouTube video URL
 * @param {string} videoUrl
 * @returns {Promise<string|null>}
 */
export async function extractTextFromYoutube(videoUrl) {
  try {
    if (!videoUrl) return null;

    let videoId = '';
    if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1].split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    } else if (videoUrl.includes('embed/')) {
      videoId = videoUrl.split('embed/')[1].split('?')[0];
    } else {
      videoId = videoUrl;
    }

    if (!videoId) return null;

    const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptList || transcriptList.length === 0) return null;

    const transcriptText = transcriptList.map((item) => item.text).join(' ');
    return transcriptText;
  } catch (error) {
    console.error('[ExtractorService] Error extracting YouTube transcript:', error.message);
    return null;
  }
}

export default {
  extractTextFromPdf,
  extractTextFromYoutube,
};
