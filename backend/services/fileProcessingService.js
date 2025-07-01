const TextSummarizer = require('../utils/textSummarizer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');

class FileProcessingService {
  constructor() {
    this.summarizer = new TextSummarizer();
  }

  async processFile(file) {
    try {
      const fileExtension = this.getFileExtension(file.originalname);
      let extractedText = '';

      switch (fileExtension) {
        case '.txt':
          extractedText = await this.extractTextFromTxt(file);
          break;
        case '.docx':
          extractedText = await this.extractTextFromDocx(file);
          break;
        case '.pdf':
          extractedText = await this.extractTextFromPdf(file);
          break;
        case '.doc':
          extractedText = await this.extractTextFromDoc(file);
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

  getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
  }

  async extractTextFromTxt(file) {
    return file.buffer.toString('utf-8');
  }

  async extractTextFromDocx(file) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  async extractTextFromPdf(file) {
    try {
      const data = await pdfParse(file.buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  async extractTextFromDoc(file) {
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

  getCacheStats() {
    return this.summarizer.getCacheStats();
  }

  clearCache() {
    this.summarizer.clearCache();
  }
}

module.exports = FileProcessingService;
