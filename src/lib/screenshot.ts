import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  filename?: string;
  backgroundColor?: string;
  scale?: number;
  watermarkText?: string;
  onStart?: () => void;
  onSuccess?: (dataUrl: string) => void;
  onError?: (err: Error) => void;
}

/**
 * Captures an HTML element as a high-resolution PNG image and triggers browser download.
 */
export async function captureAndDownloadScreenshot(
  target: HTMLElement | string,
  options: ScreenshotOptions = {}
): Promise<string> {
  const {
    filename = `IslamRoots_Capture_${Date.now()}.png`,
    backgroundColor = '#FAFBF9',
    scale = 2,
    watermarkText = 'IslamRoots AI Educator Workspace',
    onStart,
    onSuccess,
    onError,
  } = options;

  if (onStart) onStart();

  try {
    const element =
      typeof target === 'string'
        ? (document.getElementById(target) as HTMLElement)
        : target;

    if (!element) {
      throw new Error(`Element not found for screenshot capture.`);
    }

    // Capture using html2canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth || element.clientWidth,
      windowHeight: element.scrollHeight || element.clientHeight,
    });

    // Create a final canvas with space for a clean header/footer watermark banner
    const finalCanvas = document.createElement('canvas');
    const paddingBottom = 40;
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height + paddingBottom;

    const ctx = finalCanvas.getContext('2d');
    if (ctx) {
      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw original captured canvas
      ctx.drawImage(canvas, 0, 0);

      // Draw footer branding banner
      ctx.fillStyle = '#2D3A2E'; // Forest primary tone
      ctx.fillRect(0, canvas.height, finalCanvas.width, paddingBottom);

      ctx.fillStyle = '#F3F4F1';
      ctx.font = `600 ${Math.max(12 * scale, 20)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        watermarkText,
        finalCanvas.width / 2,
        canvas.height + paddingBottom / 2
      );
    }

    const dataUrl = finalCanvas.toDataURL('image/png');

    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onSuccess) onSuccess(dataUrl);
    return dataUrl;
  } catch (err: any) {
    console.error('[SCREENSHOT_CAPTURE_ERROR]', err);
    if (onError) onError(err);
    throw err;
  }
}

/**
 * Fallback print function to trigger browser printing for a specific DOM node.
 */
export function printElement(target: HTMLElement | string, title: string = 'IslamRoots Document'): void {
  const element =
    typeof target === 'string'
      ? (document.getElementById(target) as HTMLElement)
      : target;

  if (!element) {
    console.error('[PRINT_ELEMENT_ERROR] Target element not found');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((s) => s.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${title}</title>
        ${styles}
        <style>
          body {
            background-color: white !important;
            padding: 2rem !important;
            color: black !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 2rem; border-bottom: 2px solid #2D3A2E; padding-bottom: 1rem;">
          <h1 style="font-size: 1.5rem; color: #2D3A2E; margin: 0;">IslamRoots AI Educator Network</h1>
          <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.875rem;">Exported on ${new Date().toLocaleDateString()}</p>
        </div>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}
