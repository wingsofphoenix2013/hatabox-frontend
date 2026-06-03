import { DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  Select,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import api from '../api/client';

const { Text } = Typography;

const { Dragger } = Upload;

function ProductionProductGalleryCreateDrawer({ open, onClose, productId }) {
  const [fileList, setFileList] = useState([]);
  const [uploadMode, setUploadMode] = useState(null);
  const [hoveredFileUid, setHoveredFileUid] = useState(null);
  const [attachmentTypeOptions, setAttachmentTypeOptions] = useState([]);
  const [attachmentTargets, setAttachmentTargets] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [attachmentTarget, setAttachmentTarget] = useState(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');

  const handleClose = () => {
    setFileList([]);
    setUploadMode(null);
    setAttachmentType(null);
    setAttachmentTarget(null);
    setAttachmentName('');
    setAttachmentDescription('');
    onClose();
  };

  const handleNextStep = async () => {
    if (fileList.length === 0) {
      return;
    }

    const nextUploadMode = fileList.length === 1 ? 'single' : 'bulk';

    setUploadMode(nextUploadMode);

    const [typesResponse, targetsResponse] = await Promise.all([
      api.get('product-attachments/attachment-types/'),
      api.get(`products/${productId}/attachment-targets/`),
    ]);

    setAttachmentTypeOptions(
      Array.isArray(typesResponse.data) ? typesResponse.data : [],
    );
    setAttachmentTargets(targetsResponse.data || null);
  };

  return (
    <Drawer
      title="Додати файли"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card
          title={
            uploadMode
              ? fileList.length === 1
                ? '1. Файл для завантаження'
                : '1. Файли для завантаження'
              : '1. Додайте один або кілька файлів'
          }
        >
          <Flex vertical gap={12}>
            {!uploadMode && (
              <Dragger
                multiple
                beforeUpload={() => false}
                style={{ marginBottom: 12 }}
                fileList={fileList}
                onChange={({ fileList: nextFileList }) => {
                  setFileList(nextFileList);
                  setUploadMode(null);
                  setHoveredFileUid(null);
                }}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>

                <p className="ant-upload-text">
                  Натисніть або перетягніть файли в цю область
                </p>

                <p className="ant-upload-hint">
                  Можна додати один або кілька файлів.
                </p>
              </Dragger>
            )}

            {fileList.map((file) => (
              <Flex
                key={file.uid}
                justify="space-between"
                align="center"
                gap={12}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  background:
                    hoveredFileUid === file.uid ? '#fafafa' : '#ffffff',
                }}
                onMouseEnter={() => setHoveredFileUid(file.uid)}
                onMouseLeave={() => setHoveredFileUid(null)}
              >
                <Text
                  style={{
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={file.name}
                >
                  {file.name}
                </Text>

                {!(uploadMode === 'single' && fileList.length === 1) && (
                  <DeleteOutlined
                    style={{
                      color:
                        hoveredFileUid === file.uid ? '#ff4d4f' : '#595959',
                      cursor: 'pointer',
                      flex: '0 0 auto',
                    }}
                    onClick={() => {
                      setFileList((prev) =>
                        prev.filter((item) => item.uid !== file.uid),
                      );
                    }}
                  />
                )}
              </Flex>
            ))}
          </Flex>
        </Card>

        {uploadMode && (
          <>
            <Card title="2. Налаштування медіа">
              <Flex vertical gap={14}>
                <div>
                  <Text
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 12,
                      lineHeight: 1.2,
                    }}
                  >
                    {uploadMode === 'single'
                      ? 'Оберіть тип файла'
                      : 'Оберіть тип файлів'}
                  </Text>

                  <Select
                    value={attachmentType}
                    options={attachmentTypeOptions}
                    placeholder="Тип вкладення"
                    style={{ width: '100%' }}
                    onChange={setAttachmentType}
                  />
                </div>

                <div>
                  <Text
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 12,
                      lineHeight: 1.2,
                    }}
                  >
                    Оберіть привʼязку до продукту, етапу або робочого процесу
                  </Text>

                  <Select
                    value={attachmentTarget}
                    placeholder="Привʼязка"
                    style={{ width: '100%' }}
                    onChange={setAttachmentTarget}
                    options={[
                      attachmentTargets?.product
                        ? {
                            value: `product:${attachmentTargets.product.id}`,
                            label: attachmentTargets.product.label,
                          }
                        : null,
                      ...(attachmentTargets?.steps || []).flatMap((step) => [
                        {
                          value: `step:${step.id}`,
                          label: step.label,
                        },
                        ...(step.works || []).map((work) => ({
                          value: `work:${work.id}`,
                          label: work.label,
                        })),
                      ]),
                    ].filter(Boolean)}
                  />
                </div>
              </Flex>
            </Card>

            {uploadMode === 'single' && (
              <Card title="3. Опис файла">
                <Flex vertical gap={14}>
                  <div>
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: 6,
                        fontSize: 12,
                        lineHeight: 1.2,
                      }}
                    >
                      Оберіть назву
                    </Text>

                    <Input
                      value={attachmentName}
                      onChange={(event) =>
                        setAttachmentName(event.target.value)
                      }
                      placeholder="Назва файла"
                    />
                  </div>

                  <div>
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: 6,
                        fontSize: 12,
                        lineHeight: 1.2,
                      }}
                    >
                      Додайте опис
                    </Text>

                    <Input.TextArea
                      rows={4}
                      value={attachmentDescription}
                      onChange={(event) =>
                        setAttachmentDescription(event.target.value)
                      }
                      placeholder="Опис файла"
                    />
                  </div>

                  <Alert
                    type="warning"
                    showIcon
                    message="Ці поля не є обовʼязковими."
                  />
                </Flex>
              </Card>
            )}
          </>
        )}

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose}>Закрити</Button>

          {!uploadMode ? (
            <Tooltip
              title={
                fileList.length === 0
                  ? 'Для наступного кроку потрібно додати хоча б один файл.'
                  : ''
              }
            >
              <Button
                type="primary"
                disabled={fileList.length === 0}
                onClick={handleNextStep}
              >
                Наступний крок
              </Button>
            </Tooltip>
          ) : (
            <Button type="primary">Завантажити</Button>
          )}
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryCreateDrawer;
