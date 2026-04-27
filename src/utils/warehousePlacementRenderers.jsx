// src/utils/warehousePlacementRenderers.jsx

import { Flex, Tag, Typography } from 'antd';

const { Text } = Typography;

export const getLocationTagStyle = () => ({
  color: '#595959',
  background: '#fafafa',
  borderColor: '#d9d9d9',
  fontWeight: 600,
  minWidth: 34,
  textAlign: 'center',
});

export const getPlacementTagColor = (label = '') => {
  const normalized = label.toLowerCase();

  if (normalized.includes('контейнер')) return 'processing';
  if (normalized.includes('стелаж')) return 'success';
  if (normalized.includes('бокс')) return 'warning';

  return 'default';
};

export const renderStoragePlaceChain = (value) => {
  if (!value) return null;

  const normalizedValue = value.replace(/\s+на локації\s*$/i, '');

  const parts = normalizedValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <Flex wrap={false} gap={6} style={{ whiteSpace: 'nowrap' }}>
      {parts.map((part, index) => {
        const tokens = part.split(' ');
        const code = tokens.pop();
        const label = tokens.join(' ');

        return (
          <Flex key={`${part}-${index}`} align="center" gap={4}>
            <span>{label}</span>
            <Tag
              color={getPlacementTagColor(label)}
              style={{ marginInlineEnd: 0, fontWeight: 600 }}
            >
              {code}
            </Tag>
            {index < parts.length - 1 && <span>,</span>}
          </Flex>
        );
      })}
    </Flex>
  );
};

export const renderWarehousePlacement = ({
  locationCode,
  locationName,
  storagePlaceId,
  storagePlaceDisplayName,
  storagePlaceFullDisplay,
}) => (
  <Flex align="center" gap={6} wrap={false} style={{ minWidth: 0 }}>
    <Tag
      style={{
        ...getLocationTagStyle(),
        marginInlineEnd: 0,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={`${locationCode || '—'} - ${locationName || '—'}`}
    >
      {(locationCode || '—') + ' - ' + (locationName || '—')}
    </Tag>

    {storagePlaceId ? (
      <>
        <Text type="secondary">:</Text>
        <div
          title={storagePlaceDisplayName || undefined}
          style={{
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {renderStoragePlaceChain(storagePlaceFullDisplay)}
        </div>
      </>
    ) : null}
  </Flex>
);
