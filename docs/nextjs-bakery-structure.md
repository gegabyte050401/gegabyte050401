# Next.js bakery e-commerce structure (step-by-step)

This structure is designed for **Next.js App Router + Prisma + NextAuth + Stripe**.

## 1) Create app and install dependencies

```bash
npx create-next-app@latest bakery-shop --typescript --eslint --app
cd bakery-shop
npm i @prisma/client prisma next-auth bcrypt zod stripe
npm i -D tsx
```

## 2) Suggested folder structure

```text
bakery-shop/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  ├─ (store)/
│  │  │  ├─ page.tsx                    # home/catalog landing
│  │  │  ├─ products/
│  │  │  │  ├─ page.tsx                 # product listing
│  │  │  │  └─ [slug]/page.tsx          # product detail
│  │  │  ├─ cart/page.tsx               # shopping cart
│  │  │  ├─ checkout/page.tsx           # address/review/pay start
│  │  │  └─ order-success/page.tsx      # return URL after payment
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  └─ forgot-password/page.tsx
│  │  ├─ (account)/
│  │  │  ├─ account/page.tsx            # profile overview
│  │  │  ├─ account/orders/page.tsx     # purchase history
│  │  │  └─ account/orders/[id]/page.tsx
│  │  ├─ (admin)/
│  │  │  ├─ admin/page.tsx
│  │  │  ├─ admin/products/page.tsx
│  │  │  └─ admin/orders/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ cart/route.ts
│  │  │  ├─ checkout/route.ts
│  │  │  ├─ orders/route.ts
│  │  │  └─ webhooks/stripe/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ product-card.tsx
│  │  ├─ cart-drawer.tsx
│  │  ├─ checkout-form.tsx
│  │  └─ ui/*
│  ├─ lib/
│  │  ├─ prisma.ts                       # singleton Prisma client
│  │  ├─ auth.ts                         # NextAuth config/helpers
│  │  ├─ stripe.ts                       # Stripe server client
│  │  ├─ validations.ts                  # Zod schemas
│  │  └─ currency.ts
│  ├─ server/
│  │  ├─ cart.ts                         # cart business logic
│  │  ├─ order.ts                        # order creation logic
│  │  └─ product.ts
│  ├─ types/
│  │  └─ index.ts
│  └─ middleware.ts                      # route protection for account/admin
├─ .env
├─ package.json
└─ next.config.ts
```

## 3) Environment variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 4) Recommended implementation order

1. **Data layer**
   - Add `prisma/schema.prisma`.
   - Run migrations and generate Prisma client.
2. **Auth**
   - Implement register/login with hashed password (`bcrypt`).
   - Configure NextAuth session handling.
3. **Catalog**
   - Build products list and product detail pages.
4. **Cart**
   - Guest cart via cookie token.
   - Logged-in cart persisted in DB.
   - Merge guest cart into user cart on login.
5. **Checkout + Stripe**
   - Create order draft from cart.
   - Start Stripe checkout session.
   - Handle webhook to mark payment succeeded/failed.
6. **Orders and account**
   - Save `Order` + `OrderItem` rows.
   - Show order history under `/account/orders`.
7. **Admin**
   - CRUD for products.
   - Order status updates (`PREPARING`, `READY_FOR_PICKUP`, etc).

## 5) Commands you'll run frequently

```bash
npx prisma migrate dev -n init
npx prisma generate
npm run dev
```

## 6) Production notes

- Never store raw payment card data; use Stripe Checkout or Elements.
- Add rate limiting to auth and checkout endpoints.
- Use HTTPS and secure cookies in production.
- Consider email verification and password reset before launch.
