import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'
import ProductForm from '../../components/ProductForm.jsx'
import SellerStatusNotice from '../../components/SellerStatusNotice.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useMarket } from '../../hooks/useMarket.js'
import { EMPTY_PRODUCT } from '../../lib/productForm.js'
import { sellerReadiness } from '../../lib/sellerStatus.js'
import { WEIGHT_CATEGORIES } from '../../lib/units.js'

export default function AddProduct() {
  const { user } = useAuth()
  const { addProduct, capabilities } = useMarket()
  const navigate = useNavigate()

  async function handleSubmit(values, imageFile) {
    const product = await addProduct(values, imageFile)
    navigate('/seller/products', {
      state: {
        flash: {
          type: 'success',
          message: product.isActive
            ? `“${product.name}” is now listed in the marketplace.`
            : `“${product.name}” was saved as a hidden listing.`,
        },
      },
    })
  }

  return (
    <>
      <PageHeader eyebrow="Seller dashboard" title="Add Product" description="Create a new listing for your shop." />
      {sellerReadiness(user) === 'ready' ? (
        <ProductForm
          initialValues={{
            ...EMPTY_PRODUCT,
            category: user.shop.category ?? '',
            unit: WEIGHT_CATEGORIES.includes(user.shop.category) ? 'kg' : 'piece',
          }}
          submitLabel="Publish Product"
          savingLabel="Publishing…"
          onSubmit={handleSubmit}
          cancelTo="/seller/products"
          imageUpload={capabilities.imageUpload}
          locationLabel={`Brgy. ${user.shop.barangay}, ${user.shop.municipality}`}
        />
      ) : (
        <SellerStatusNotice />
      )}
    </>
  )
}
