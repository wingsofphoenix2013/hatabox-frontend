import { useParams } from 'react-router-dom';

function ProductionProductGalleryPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Галерея продукту</h2>
      <div>Продукт ID: {id}</div>
    </div>
  );
}

export default ProductionProductGalleryPage;
