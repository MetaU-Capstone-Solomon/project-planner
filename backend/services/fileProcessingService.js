const TextSummarizer = require('../utils/textSummarizer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');

// Handles text extraction and processing from various file formats
class FileProcessingService {
  constructor() {
    this.summarizer = new TextSummarizer();
  }

  // Processes uploaded files and returns original and summarized text
  async processFile(file) {
    try {
      const fileExtension = this._getFileExtension(file.originalname);
      let extractedText = '';

      switch (fileExtension) {
        case '.txt':
          extractedText = await this._extractTextFromTxt(file);
          break;
        case '.docx':
          extractedText = await this._extractTextFromDocx(file);
          break;
        case '.pdf':
          extractedText = await this._extractTextFromPdf(file);
          break;
        case '.doc':
          extractedText = await this._extractTextFromDoc(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content found in file');
      }

      // Summarize if needed
      const processedText = this.summarizer.summarize(extractedText);

      return {
        originalText: extractedText,
        processedText,
        fileName: file.originalname,
        fileSize: file.size,
        isSummarized: extractedText.length > processedText.length,
      };
    } catch (error) {
      throw new Error(`File processing failed: ${error.message}`);
    }
  }

  // Gets the lowercase file extension from filename
  _getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
  }

  // Extracts text from TXT files using UTF-8 encoding
  async _extractTextFromTxt(file) {
    return file.buffer.toString('utf-8');
  }

  // Extracts raw text from DOCX files using mammoth
  async _extractTextFromDocx(file) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  // Extracts text content from PDF files
  async _extractTextFromPdf(file) {
    try {
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Extracts text from legacy DOC files using textract
  async _extractTextFromDoc(file) {
    try {
      return new Promise((resolve, reject) => {
        textract.fromBufferWithName(file.originalname, file.buffer, (error, text) => {
          if (error) {
            reject(new Error(`Failed to extract text from DOC: ${error.message}`));
          } else {
            resolve(text);
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to extract text from DOC: ${error.message}`);
    }
  }

  // Returns current summarizer cache statistics
  _getCacheStats() {
    return this.summarizer.getCacheStats();
  }

  // Clears the summarizer cache
  _clearCache() {
    this.summarizer.clearCache();
  }
}

module.exports = FileProcessingService;
