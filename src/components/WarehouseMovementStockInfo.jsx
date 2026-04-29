import { Card, Descriptions, Flex, Tag, Tooltip, Typography } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import { formatQuantity } from '../utils/formatNumber';
import {
  getLocationTagStyle,
  renderStoragePlaceChain,
} from '../utils/warehousePlacementRenderers';

const { Text } = Typography;

function WarehouseMovementStockInfo({ stockItem, activePlan }) {
  if (!stockItem) return null;

  const unit = stockItem.inventory_item_unit_symbol || '';

  const availablePlacements = Array.isArray(stockItem.available_placements)
    ? stockItem.available_placements
    : [];

  return (
    <Card size="small" style={{ background: '#fafafa' }}>
      <Flex vertical gap={12}>
        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 6 }}
          >
            Інформація
          </Text>

          <Descriptions
            size="small"
            column={2}
            items={[
              {
                key: 'code',
                label: 'Артикул',
                children: stockItem.inventory_item_code || '—',
              },
              {
                key: 'category',
                label: 'Категорія',
                children: stockItem.inventory_item_category_name || '—',
              },
            ]}
          />
        </div>

        <div>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 12, marginBottom: 6 }}
          >
            Доступність
          </Text>

          <Descriptions
            size="small"
            column={2}
            items={[
              {
                key: 'available',
                label: 'Доступно для переміщення',
                children: (
                  <Text strong style={{ color: '#52c41a' }}>
                    {formatQuantity(stockItem.available_quantity)} {unit}
                  </Text>
                ),
              },
              {
                key: 'reserved',
                label: 'Вже зарезервовано',
                children: (
                  <Text strong style={{ color: '#8c8c8c' }}>
                    {formatQuantity(stockItem.reserved_quantity)} {unit}
                  </Text>
                ),
              },
            ]}
          />
        </div>

        {availablePlacements.length > 0 && (
          <div style={{ marginTop: 2 }}>
            <Text
              type="secondary"
              style={{ display: 'block', fontSize: 12, marginBottom: 6 }}
            >
              Довідка про розміщення
            </Text>

            <Flex vertical gap={6}>
              {availablePlacements.map((placement, index) => {
                const isSameDestination =
                  !activePlan?.target_storage_place &&
                  placement.location_code === activePlan?.target_location_code;

                return (
                  <Flex
                    key={`${placement.location_code || 'location'}-${
                      placement.storage_place_full_display || 'root'
                    }-${index}`}
                    align="flex-end"
                    gap={8}
                  >
                    <Flex align="center" gap={6} style={{ minWidth: 0 }}>
                      {placement.storage_place_full_display ? (
                        <>
                          <Tag style={getLocationTagStyle()}>
                            {placement.location_code || '—'}
                          </Tag>

                          <Text type="secondary">:</Text>

                          {renderStoragePlaceChain(
                            placement.storage_place_full_display,
                          )}
                        </>
                      ) : (
                        <Flex align="center" gap={6}>
                          <Text>Локація</Text>

                          <Tag style={getLocationTagStyle()}>
                            {placement.location_code || '—'}
                          </Tag>

                          <Text>{placement.location_name || '—'}</Text>
                        </Flex>
                      )}

                      {isSameDestination && (
                        <Tooltip title="Цей товар вже знаходиться у вибраному місці призначення.">
                          <WarningFilled
                            style={{
                              color: '#ff4d4f',
                              fontSize: 14,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Flex>

                    <div
                      style={{
                        flex: 1,
                        borderBottom: '1px dotted #d9d9d9',
                        margin: '0 6px',
                        transform: 'translateY(-2px)',
                      }}
                    />

                    <Text strong style={{ whiteSpace: 'nowrap' }}>
                      {formatQuantity(placement.available_quantity)}{' '}
                      {placement.unit_symbol || unit}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </div>
        )}
      </Flex>
    </Card>
  );
}

export default WarehouseMovementStockInfo;
