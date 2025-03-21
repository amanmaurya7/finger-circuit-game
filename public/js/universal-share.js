/**
 * Universal Share Helper
 * 
 * This utility provides cross-platform, cross-browser image sharing capabilities
 * with multiple fallback strategies to ensure images can be shared on any device.
 */

class UniversalShare {
  /**
   * Share image with text across any platform
   * @param {Object} options Share options
   * @param {string} options.title Title for share
   * @param {string} options.text Text content to share
   * @param {string} options.imageUrl URL of the image to share
   * @param {string} options.fallbackUrl Fallback URL to include in share
   */
  static async shareImageWithText(options) {
    const { title, text, imageUrl, fallbackUrl } = options;
    
    // Always copy text to clipboard as backup
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("Clipboard copy failed, continuing with share", err);
    }
    
    // Track which sharing method succeeded
    let shareSuccess = false;
    
    // STRATEGY 1: Web Share API with files (most comprehensive)
    if (!shareSuccess) {
      try {
        if (navigator.canShare && navigator.share) {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], "share-image.png", { type: "image/png" });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              text: text,
              files: [file]
            });
            shareSuccess = true;
            return true;
          }
        }
      } catch (err) {
        console.warn("Share API with files failed, trying next method", err);
      }
    }
    
    // STRATEGY 2: Web Share API without files
    if (!shareSuccess) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: title,
            text: text + (imageUrl ? "\n\n" + imageUrl : ""),
            url: fallbackUrl
          });
          shareSuccess = true;
          return true;
        }
      } catch (err) {
        console.warn("Share API without files failed, trying next method", err);
      }
    }
    
    // STRATEGY 3: Platform-specific sharing
    if (!shareSuccess) {
      // iOS-specific sharing
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        try {
          // Try to use native iOS sharing
          window.open(`sms:&body=${encodeURIComponent(text)}`);
          shareSuccess = true;
          return true;
        } catch (err) {
          console.warn("iOS specific share failed", err);
        }
      }
      
      // Android-specific sharing (via intent)
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid) {
        try {
          // Create a deep link with intent
          const intentUrl = `intent:#Intent;scheme=data;package=com.android.chrome;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(text)};end`;
          window.location.href = intentUrl;
          shareSuccess = true;
          return true;
        } catch (err) {
          console.warn("Android specific share failed", err);
        }
      }
    }
    
    // STRATEGY 4: Download image and alert
    if (!shareSuccess && imageUrl) {
      try {
        // Create temporary download link
        const tempLink = document.createElement('a');
        tempLink.href = imageUrl;
        tempLink.download = 'share-image.png';
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        
        // Click the link to download
        tempLink.click();
        document.body.removeChild(tempLink);
        
        // Show modal with instructions
        setTimeout(() => {
          alert("画像がダウンロードされました！\n画像と一緒にSNSでシェアしましょう！");
        }, 1000);
        shareSuccess = true;
        return true;
      } catch (err) {
        console.warn("Download approach failed", err);
      }
    }
    
    // FINAL FALLBACK: Alert user that text is copied and to take screenshot
    if (!shareSuccess) {
      alert("テキストがコピーされました。スクリーンショットを撮ってSNSでシェアしてください。");
      return false;
    }
  }
  
  /**
   * Generate image from HTML element
   * @param {HTMLElement} element Element to convert to image
   * @param {Object} options Options for image generation
   * @returns {Promise<string>} Image data URL
   */
  static async generateImageFromElement(element, options = {}) {
    const { quality = 1.0, scale = 2 } = options;
    
    // Make element temporarily visible if needed
    const originalVisibility = element.style.visibility;
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;
    const originalLeft = element.style.left;
    const originalTop = element.style.top;
    
    // Position for rendering
    element.style.visibility = 'visible';
    element.style.position = 'absolute';
    element.style.zIndex = '-1';
    element.style.left = '0';
    element.style.top = '0';
    
    try {
      // Add delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try html2canvas with optimal settings
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false
      });
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png", quality);
      
      return dataUrl;
    } catch (error) {
      console.error("Failed to generate image from element:", error);
      throw error;
    } finally {
      // Restore original element properties
      element.style.visibility = originalVisibility;
      element.style.position = originalPosition;
      element.style.zIndex = originalZIndex;
      element.style.left = originalLeft;
      element.style.top = originalTop;
    }
  }
  
  /**
   * Create fallback image with minimal dependencies
   * @param {Object} options Image options
   * @returns {Promise<string>} Image data URL
   */
  static createFallbackImage(options) {
    const { 
      width = 320, 
      height = 320, 
      title = 'FINGER CIRCUIT',
      subtitle = 'SCORE',
      score = '100%',
      backgroundColor = '#ffffff'
    } = options;
    
    return new Promise((resolve, reject) => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw border
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, width - 20, height - 20);
        
        // Draw title
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.floor(width/13)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(title, width/2, height/4);
        
        // Draw subtitle
        ctx.fillStyle = '#666666';
        ctx.font = `${Math.floor(width/20)}px Arial, sans-serif`;
        ctx.fillText(subtitle, width/2, height/3);
        
        // Draw score
        ctx.fillStyle = '#fd6aa0';
        ctx.font = `bold ${Math.floor(width/4)}px Arial, sans-serif`;
        ctx.fillText(score, width/2, height/1.8);
        
        // Return as data URL
        resolve(canvas.toDataURL('image/png', 0.9));
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Make available globally
window.UniversalShare = UniversalShare;
