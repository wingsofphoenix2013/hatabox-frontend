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
  paymentState,
  paymentActions,
  recipientAccountOptions,
  recipientAccountsLoading,
  savingPayment,
  handleSavePayment,
  handlePaymentTransferFileChange,
  getPaymentStatusTagColor,
  getAvailablePaymentStatusOptions,
  PAYMENT_STATUS_LABELS,
  formatMoney,
  formatDateDisplay,
}) {
  const paymentDocuments = Array.isArray(order?.payment_documents)
    ? order.payment_documents
    : [];

  const {
    selectedPaymentId,
    selectedPaymentDocument,
    editingPaymentStatus,
    editingPaymentDate,
    editingPaymentAmount,
    selectedRecipientAccountId,
    paymentTransferFile,
  } = paymentState;

  const {
    setSelectedPaymentId,
    setEditingPaymentStatus,
    setEditingPaymentDate,
    setEditingPaymentAmount,
    setSelectedRecipientAccountId,
  } = paymentActions;

  const labelStyle = {
    display: 'block',
    marginBottom: 8,
  };

  const isPaid = selectedPaymentDocument?.status === 'paid';
  const isApproved = selectedPaymentDocument?.status === 'approved';

  const isPaymentFormInvalid =
    editingPaymentStatus === 'paid' &&
    (!selectedRecipientAccountId ||
      !editingPaymentDate ||
      !paymentTransferFile ||
      recipientAccountOptions.length === 0);

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
                <Text style={labelStyle}>Статус платежу</Text>

                {isPaid ? (
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
                <Text style={labelStyle}>Сума платежу</Text>

                {isPaid ? (
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
        {selectedPaymentDocument && (isApproved || isPaid) && (
          <Card title="3. Переказ">
            <Flex vertical gap={16}>
              {isApproved ? (
                <>
                  {/* ACCOUNT */}
                  <div>
                    <Text style={labelStyle}>
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
                    <Text style={labelStyle}>Дата платежу</Text>

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
                    <Text style={labelStyle}>Файл переказу</Text>

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
                    <Text style={labelStyle}>Дата платежу</Text>

                    <Text>
                      {formatDateDisplay(selectedPaymentDocument.payment_date)}
                    </Text>
                  </div>

                  {/* FILE VIEW */}
                  <div>
                    <Text style={labelStyle}>Файл переказу</Text>

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
            !isPaid &&
            selectedPaymentDocument.status !== 'cancelled' && (
              <Button
                type="primary"
                loading={savingPayment}
                onClick={handleSavePayment}
                disabled={isPaymentFormInvalid || !selectedPaymentDocument}
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
