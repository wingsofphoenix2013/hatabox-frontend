import { useState } from 'react';
import { Alert, Flex, Spin, Typography } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';

const { Text } = Typography;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function PdfPreview({ fileUrl, width = 220, clickable = false }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [pageCount, setPageCount] = useState(null);

  if (!fileUrl) {
    return null;
  }

  const handleError = (prefix, error) => {
    const message =
      error?.message ||
      error?.toString?.() ||
      'Невідома помилка під час завантаження PDF';

    console.error(`${prefix}:`, error);
    setErrorMessage(`${prefix}: ${message}`);
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        cursor: clickable ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (clickable && fileUrl) {
          window.open(fileUrl, '_blank');
        }
      }}
    >
      <Flex vertical align="center" gap={8} style={{ width: '100%' }}>
        {errorMessage ? (
          <Alert
            type="warning"
            showIcon
            message="Не вдалося завантажити прев’ю PDF"
            description={
              <Text style={{ fontSize: 12, wordBreak: 'break-word' }}>
                {errorMessage}
              </Text>
            }
          />
        ) : (
          <Document
            file={fileUrl}
            loading={<Spin />}
            onSourceError={(error) => handleError('PDF source error', error)}
            onLoadError={(error) => handleError('PDF load error', error)}
            onLoadSuccess={(pdf) => {
              setErrorMessage('');
              setPageCount(pdf?.numPages || null);
            }}
            error={
              <Alert
                type="warning"
                showIcon
                message="Не вдалося завантажити документ PDF"
              />
            }
          >
            <Page
              pageNumber={1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={<Spin />}
              onRenderError={(error) => handleError('PDF render error', error)}
              onGetTextError={(error) =>
                handleError('PDF text layer error', error)
              }
              onGetStructTreeError={(error) =>
                handleError('PDF structure error', error)
              }
              error={
                <Alert
                  type="warning"
                  showIcon
                  message="Не вдалося відрендерити першу сторінку PDF"
                />
              }
            />
          </Document>
        )}

        {!errorMessage && pageCount === 0 && (
          <Alert type="warning" showIcon message="PDF не містить сторінок" />
        )}
      </Flex>
    </div>
  );
}

export default PdfPreview;
