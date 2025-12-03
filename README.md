# Monorepo (customer/seller/admin + server)

Bu paket: 3 frontend repo'yu (customer, seller, admin) tek bir monorepo altına koyup, server (Node.js + Express + PostgreSQL) ile entegre olacak şekilde hazırlanmıştır.

Özet
- server/: Node.js + Express + Sequelize (Postgres)
- clients/customer: müşteri frontend (mevcut musteri-paneli4)
- clients/seller: satıcı frontend (Satici-paneli4)
- clients/admin: admin frontend (Admin-panel4)
- docker-compose.yml: Postgres + server için

Nasıl kullanırım?
1) Repo klasör yapısını oluştur:
   - monorepo/
     - docker-compose.yml
     - server/ (yukarıdaki server dosyaları)
     - clients/
       - customer/   (musteri-paneli4 frontend dosyalarını buraya kopyalayın)
       - seller/     (Satici-paneli4 frontend dosyalarını buraya kopyalayın)
       - admin/      (Admin-panel4 frontend dosyalarını buraya kopyalayın)

2) Frontendleri kopyalama (örnek):
   git clone https://github.com/fersain123-design/musteri-paneli4 tmp_customer
   git clone https://github.com/fersain123-design/Satici-paneli4 tmp_seller
   git clone https://github.com/fersain123-design/Admin-panel4 tmp_admin

   mkdir -p clients/customer clients/seller clients/admin
   rsync -a tmp_customer/ clients/customer/
   rsync -a tmp_seller/ clients/seller/
   rsync -a tmp_admin/ clients/admin/
   rm -rf tmp_customer tmp_seller tmp_admin

   Not: rsync yoksa cp -r ile de kopyalayabilirsiniz.

3) Server yapılandırma:
   - server/.env.example dosyasını server/.env olarak kopyalayın ve gerekli değerleri güncelleyin.
   - Güçlü bir JWT secret kullanın.

4) Docker ile çalıştırma (önerilen):
   docker-compose up --build

   Ardından:
   - server konteyneri ayağa kalktığında:
     docker-compose exec server npm run seed
     (veya local environment'da server klasöründe npm install && npm run seed)

5) Frontendler:
   - Her frontend kendi paket.json'ına göre çalıştırılır. Frontendlerde API isteği yapan yerlerde base URL'i: http://localhost:4000/api olarak ayarlayın.
   - Örnek: müşteri frontendi fetch('/api/products') → http://localhost:4000/api/products

API Endpoints (MVP)
- POST /api/auth/register
- POST /api/auth/login  → dönen token: Bearer <token>
- GET /api/products
- POST /api/products (sadece seller)
- POST /api/orders (sadece customer)
- GET /api/orders?sellerId=... ve GET /api/orders?customerId=...

Test kullanıcıları (seed ile):
- seller@example.com / password123  (role: seller)
- customer@example.com / password123 (role: customer)

NOTLAR
- Bu MVP kurulumunda veritabanı migration yerine sequelize.sync() kullanılmıştır. Üretimde migrations kullanılmalıdır.
- Gerçek zamanlı bildirimler için Socket.IO ekleyebilirim (isteğe bağlı).