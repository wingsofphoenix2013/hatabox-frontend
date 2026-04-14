import { Alert, Spin } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';

// Важно: worker должен быть настроен в том же модуле,
// где используются Document/Page
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function PdfPreview({ fileUrl, width = 220 }) {
  if (!fileUrl) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Document
        file={fileUrl}
        loading={<Spin />}
        onSourceError={(error) => {
          console.error('PDF source error:', error);
        }}
        onLoadError={(error) => {
          console.error('PDF load error:', error);
        }}
        error={
          <Alert
            type="warning"
            showIcon
            message="Не вдалося завантажити прев’ю PDF"
          />
        }
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}

export default PdfPreview;
