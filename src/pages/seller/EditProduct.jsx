import { PackageX, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import LoadState from '../../components/LoadState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductForm from '../../components/ProductForm.jsx'
import SellerStatusNotice from '../../components/SellerStatusNotice.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useMarket } from '../../hooks/useMarket.js'
import { productToForm } from '../../lib/productForm.js'
import { sellerReadiness } from '../../lib/sellerStatus.js'

export default function EditProduct() {
  const { id } = useParams()
  const { user } = useAuth()
  const { products, status, error, reload, updateProduct, capabilities } = useMarket()
  const navigate = useNavigate()

  if (status !== 'ready') return <LoadState status={status} error={error} onRetry={reload} />

  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <EmptyState icon={PackageX} title="Product not found" action={<Button to="/seller/products">Back to My Products</Button>}>
        This listing may have been deleted, or it belongs to another shop.
      </EmptyState>
    )
  }

  if (product.sellerId !== user.id) {
    return (
      <EmptyState icon={ShieldAlert} title="You can’t edit this listing" action={<Button to="/seller/products">Back to My Products</Button>}>
        “{product.name}” belongs to {product.shopName}. Sellers can only manage their own products.
      </EmptyState>
    )
  }

  async function handleSubmit(values, imageFile) {
    const updated = await updateProduct(product.id, values, imageFile)
    navigate('/seller/products', {
      state: { flash: { type: 'success', message: `Changes to “${updated.name}” were saved.` } },
    })
  }

  return (
    <>
      <PageHeader eyebrow="Seller dashboard" title="Edit Product" description={`Update the details for “${product.name}”.`} />
      {sellerReadiness(user) === 'ready' ? (
        <ProductForm
          key={product.id}
          initialValues={productToForm(product)}
          submitLabel="Save Changes"
          savingLabel="Saving…"
          onSubmit={handleSubmit}
          cancelTo="/seller/products"
          imageUpload={capabilities.imageUpload}
          locationLabel={`Brgy. ${product.barangay}, ${product.municipality}`}
        />
      ) : (
        <SellerStatusNotice />
      )}
    </>
  )
}
