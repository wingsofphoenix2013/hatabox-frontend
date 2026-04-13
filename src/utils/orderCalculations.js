export const getReceiptDocumentTotal = (receiptDocument, orderItems = []) => {
  const docItems = Array.isArray(receiptDocument?.items)
    ? receiptDocument.items
    : [];

  return docItems.reduce((sum, receiptItem) => {
    const sourceOrderItem = orderItems.find(
      (item) => item.id === receiptItem.order_item,
    );

    const agreedPrice = Number(sourceOrderItem?.agreed_price) || 0;
    const receivedQuantity = Number(receiptItem?.received_quantity) || 0;

    return sum + agreedPrice * receivedQuantity;
  }, 0);
};
