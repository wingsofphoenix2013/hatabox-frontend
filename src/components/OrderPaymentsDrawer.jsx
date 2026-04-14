import { UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  InputNumber,
  Select,
  Tag,
  Typography,
  Upload,
} from 'antd';

const { Text } = Typography;

function OrderPaymentsDrawer({
  open,
  onClose,
  order,

  selectedPaymentId,
  setSelectedPaymentId,
  selectedPaymentDocument,

  editingPaymentStatus,
  setEditingPaymentStatus,
  editingPaymentDate,
  setEditingPaymentDate,
  editingPaymentAmount,
  setEditingPaymentAmount,

  recipientAccountOptions,
  recipientAccountsLoading,
  selectedRecipientAccountId,
  setSelectedRecipientAccountId,

  paymentTransferFile,
  handlePaymentTransferFileChange,

  savingPayment,
  handleSavePayment,

  getPaymentStatusTagColor,
  getAvailablePaymentStatusOptions,
  PAYMENT_STATUS_LABELS,

  formatMoney,
  formatDateDisplay,
}) {
  const paymentDocuments = Array.isArray(order?.payment_documents)
    ? order.payment_documents
    : [];

  return (
    <Drawer
      title="Редагувати оплати"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        {/* STEP 1 */}
        <Card title="1. Оберіть платіжну інструкцію">
          <Select
            placeholder="Оберіть платіжну інструкцію"
            style={{ width: '100%' }}
            value={selectedPaymentId}
            onChange={setSelectedPaymentId}
            options={paymentDocuments.map((item) => ({
              value: item.id,
              label: `${item.payment_no || '—'} — ${
                item.status_name || PAYMENT_STATUS_LABELS[item.status] || '—'
              }`,
            }))}
          />
        </Card>

        {/* STEP 2 */}
        {selectedPaymentDocument && (
          <Card title="2. Основна інформація">
            <Flex vertical gap={16}>
              {/* STATUS */}
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Статус платежу
                </Text>

                {selectedPaymentDocument.status === 'paid' ? (
                  <Tag
                    color={getPaymentStatusTagColor(
                      selectedPaymentDocument.status,
                    )}
                  >
                    {selectedPaymentDocument.status_name || '—'}
                  </Tag>
                ) : (
                  <Select
                    style={{ width: '100%' }}
                    value={editingPaymentStatus}
                    onChange={setEditingPaymentStatus}
                    options={getAvailablePaymentStatusOptions(
                      selectedPaymentDocument.status,
                    )}
                    disabled={selectedPaymentDocument.status === 'cancelled'}
                  />
                )}
              </div>

              {/* AMOUNT */}
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Сума платежу
                </Text>

                {selectedPaymentDocument.status === 'paid' ? (
                  <Text>
                    {formatMoney(selectedPaymentDocument.payment_amount)} ₴
                  </Text>
                ) : (
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    step={0.01}
                    precision={2}
                    value={editingPaymentAmount}
                    onChange={setEditingPaymentAmount}
                  />
                )}
              </div>
            </Flex>
          </Card>
        )}

        {/* STEP 3 */}
        {selectedPaymentDocument &&
          (selectedPaymentDocument.status === 'approved' ||
            selectedPaymentDocument.status === 'paid') && (
            <Card title="3. Переказ">
              <Flex vertical gap={16}>
                {selectedPaymentDocument.status === 'approved' ? (
                  <>
                    {/* ACCOUNT */}
                    <div>
                      <Text style={{ display: 'block', marginBottom: 8 }}>
                        Розрахунковий рахунок отримувача
                      </Text>

                      <Select
                        style={{ width: '100%' }}
                        placeholder={
                          recipientAccountsLoading
                            ? 'Завантаження рахунків...'
                            : recipientAccountOptions.length > 0
                              ? 'Оберіть рахунок'
                              : 'У постачальника немає активних рахунків'
                        }
                        value={selectedRecipientAccountId}
                        onChange={setSelectedRecipientAccountId}
                        options={recipientAccountOptions}
                        loading={recipientAccountsLoading}
                        disabled={
                          editingPaymentStatus !== 'paid' ||
                          recipientAccountsLoading ||
                          recipientAccountOptions.length === 0
                        }
                      />
                    </div>

                    {/* DATE */}
                    <div>
                      <Text style={{ display: 'block', marginBottom: 8 }}>
                        Дата платежу
                      </Text>

                      <DatePicker
                        style={{ width: '100%' }}
                        format="DD-MM-YYYY"
                        value={editingPaymentDate}
                        onChange={setEditingPaymentDate}
                        disabled={editingPaymentStatus !== 'paid'}
                      />
                    </div>

                    {/* FILE */}
                    <div>
                      <Text style={{ display: 'block', marginBottom: 8 }}>
                        Файл переказу
                      </Text>

                      <Upload
                        beforeUpload={() => false}
                        maxCount={1}
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handlePaymentTransferFileChange}
                        showUploadList
                        fileList={
                          paymentTransferFile
                            ? [
                                {
                                  uid:
                                    paymentTransferFile.uid ||
                                    paymentTransferFile.name,
                                  name: paymentTransferFile.name,
                                  status: 'done',
                                },
                              ]
                            : []
                        }
                        disabled={editingPaymentStatus !== 'paid'}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          disabled={editingPaymentStatus !== 'paid'}
                        >
                          Обрати файл
                        </Button>
                      </Upload>
                    </div>

                    {/* WARNING */}
                    {editingPaymentStatus === 'paid' &&
                      recipientAccountOptions.length === 0 &&
                      !recipientAccountsLoading && (
                        <Alert
                          type="warning"
                          showIcon
                          message="У постачальника немає активних розрахункових рахунків"
                        />
                      )}
                  </>
                ) : (
                  <>
                    {/* DATE VIEW */}
                    <div>
                      <Text style={{ display: 'block', marginBottom: 8 }}>
                        Дата платежу
                      </Text>

                      <Text>
                        {formatDateDisplay(
                          selectedPaymentDocument.payment_date,
                        )}
                      </Text>
                    </div>

                    {/* FILE VIEW */}
                    <div>
                      <Text style={{ display: 'block', marginBottom: 8 }}>
                        Файл переказу
                      </Text>

                      {selectedPaymentDocument.image ? (
                        <Button
                          onClick={() =>
                            window.open(selectedPaymentDocument.image, '_blank')
                          }
                        >
                          Відкрити файл
                        </Button>
                      ) : (
                        <Text type="secondary">Файл не завантажено</Text>
                      )}
                    </div>
                  </>
                )}
              </Flex>
            </Card>
          )}

        {/* ACTIONS */}
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Відміна</Button>

          {selectedPaymentDocument &&
            selectedPaymentDocument.status !== 'paid' &&
            selectedPaymentDocument.status !== 'cancelled' && (
              <Button
                type="primary"
                loading={savingPayment}
                onClick={handleSavePayment}
                disabled={
                  (editingPaymentStatus === 'paid' &&
                    (!selectedRecipientAccountId ||
                      !editingPaymentDate ||
                      !paymentTransferFile ||
                      recipientAccountOptions.length === 0)) ||
                  !selectedPaymentDocument
                }
              >
                Зберегти
              </Button>
            )}
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderPaymentsDrawer;
